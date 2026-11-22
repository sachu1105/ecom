-- =============================================================================
-- Fixed-window rate limiting shared by every server instance (works on
-- serverless where in-memory counters do not). Keys are hashed by the app:
-- raw IP addresses are never stored.
-- Only the service role may call it.
-- =============================================================================

create table private.rate_limits (
  key           text primary key check (char_length(key) <= 200),
  window_start  timestamptz not null default now(),
  hits          integer not null default 0
);

alter table private.rate_limits enable row level security;
revoke all on schema private from anon, authenticated;
revoke all on all tables in schema private from anon, authenticated;

create or replace function public.check_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hits integer;
begin
  if p_key is null or char_length(p_key) > 200 or p_limit < 1 or p_window_seconds < 1 then
    raise exception 'invalid rate limit arguments' using errcode = '22023';
  end if;

  insert into private.rate_limits as rl (key, window_start, hits)
  values (p_key, now(), 1)
  on conflict (key) do update
    set hits = case
                 when rl.window_start < now() - make_interval(secs => p_window_seconds) then 1
                 else rl.hits + 1
               end,
        window_start = case
                 when rl.window_start < now() - make_interval(secs => p_window_seconds) then now()
                 else rl.window_start
               end
  returning hits into v_hits;

  -- Opportunistic cleanup of stale keys (~1% of calls).
  if random() < 0.01 then
    delete from private.rate_limits where window_start < now() - interval '1 day';
  end if;

  return v_hits <= p_limit;
end;
$$;

revoke all on function public.check_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.check_rate_limit(text, integer, integer) to service_role;
