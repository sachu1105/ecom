export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export function actionError(error: string, fieldErrors?: Record<string, string>): ActionResult<never> {
  return { ok: false, error, fieldErrors };
}

/** Maps Postgres/PostgREST errors to safe, user-facing messages (no internals). */
export function dbErrorMessage(error: { code?: string; message?: string } | null, fallback = "Something went wrong. Please try again.") {
  if (!error) return fallback;
  switch (error.code) {
    case "23505":
      return "That slug or key is already in use. Choose a different one.";
    case "23503":
      return "This item is referenced by other content.";
    case "23514":
      return "One of the values is outside the allowed limits.";
    case "42501":
      return "You do not have permission to do that.";
    default:
      console.error("[db]", error.code, error.message);
      return fallback;
  }
}
