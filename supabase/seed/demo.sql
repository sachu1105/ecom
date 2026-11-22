-- =============================================================================
-- OPTIONAL demo content: categories, published projects and imagery from
-- images.unsplash.com so a fresh install looks complete. Run after seed.sql.
-- Delete or replace everything from the dashboard before launch.
-- Re-running is safe: it does nothing once the demo projects exist.
-- =============================================================================

do $$
declare
  u text := 'https://images.unsplash.com/photo-';
  q text := '?auto=format&fit=crop&w=2400&q=80';
  c_worktops uuid;
  c_countertops uuid;
  c_cabinetry uuid;
  c_interiors uuid;
  p uuid;
begin
  if exists (select 1 from public.projects where slug = 'marble-island-kensington') then
    raise notice 'Demo content already present, skipping.';
    return;
  end if;

  -- Categories ---------------------------------------------------------------
  insert into public.project_categories (name, slug, description, cover_image_path, display_order)
  values ('Kitchen worktops', 'kitchen-worktops',
          'Clear protective film for quartz, marble and granite worktops: resistant to stains, etching and knife marks.',
          u || '1556911220-bff31c812dba' || q, 0)
  returning id into c_worktops;

  insert into public.project_categories (name, slug, description, cover_image_path, display_order)
  values ('Countertops', 'countertops',
          'Islands, breakfast bars and vanity tops protected edge to edge.',
          u || '1600585154526-990dced4db0d' || q, 1)
  returning id into c_countertops;

  insert into public.project_categories (name, slug, description, cover_image_path, display_order)
  values ('Cabinetry', 'cabinetry',
          'Lacquered, painted and veneered cabinet doors guarded against everyday wear.',
          u || '1556909114-f6e7ad7d3136' || q, 2)
  returning id into c_cabinetry;

  insert into public.project_categories (name, slug, description, cover_image_path, display_order)
  values ('Interior surfaces', 'interior-surfaces',
          'Tables, wall panels, joinery and high-touch surfaces throughout the home.',
          u || '1600210492486-724fe5c67fb0' || q, 3)
  returning id into c_interiors;

  -- Project 1 ------------------------------------------------------------------
  insert into public.projects (title, slug, short_description, description, category_id, location, completion_date,
    application_type, material_used, cover_image_path, cover_image_alt, status, is_featured, display_order)
  values ('Marble island, Kensington', 'marble-island-kensington',
    'A Calacatta marble island protected against etching without dulling its polish.',
    'The client wanted a statement Calacatta island they could actually cook on. Untreated marble etches with lemon juice or wine within minutes.' || chr(10) || chr(10) ||
    'We templated every edge and cut-out on site and applied a high-gloss clear film that matches the honed-to-polished finish exactly. The island now handles family life without a second thought.',
    c_countertops, 'Kensington, London', '2026-09-12', 'Marble kitchen island', 'High-gloss clear protective film',
    u || '1600585154526-990dced4db0d' || q, 'Kitchen with a white marble island and pendant lights', 'published', true, 0)
  returning id into p;
  insert into public.project_media (project_id, media_type, storage_path, alt_text, display_order) values
    (p, 'image', u || '1556912173-3bb406ef7e77' || q, 'Island worktop detail', 0),
    (p, 'image', u || '1600566753190-17f0baa2a6c3' || q, 'Open-plan kitchen view', 1),
    (p, 'image', u || '1600607687939-ce8a6c25118c' || q, 'Kitchen with island seating', 2);
  insert into public.project_sections (project_id, section_type, heading, content, display_order) values
    (p, 'text', 'The challenge', '{"body": "Polished marble shows every etch mark. The family wanted to use the island daily, not tiptoe around it.", "layout": "lead"}', 0),
    (p, 'before_after', 'Gloss retained', jsonb_build_object('before', jsonb_build_object('path', u || '1556911220-bff31c812dba' || q, 'alt', 'Marble before protection'), 'after', jsonb_build_object('path', u || '1600585154526-990dced4db0d' || q, 'alt', 'Marble after protection'), 'beforeLabel', 'Before', 'afterLabel', 'After', 'caption', 'The film is invisible from normal viewing distance.'), 1),
    (p, 'specifications', 'Specification', '{"items": [{"label": "Surface", "value": "Calacatta marble, polished"}, {"label": "Film", "value": "High-gloss clear, 8 mil"}, {"label": "Area", "value": "6.2 m²"}, {"label": "Install time", "value": "1 day"}]}', 2),
    (p, 'quote', null, '{"quote": "We finally use the island the way it was meant to be used. You genuinely cannot see the film.", "author": "Homeowner", "role": "Kensington"}', 3);

  -- Project 2 ------------------------------------------------------------------
  insert into public.projects (title, slug, short_description, description, category_id, location, completion_date,
    application_type, material_used, cover_image_path, cover_image_alt, status, is_featured, display_order)
  values ('Quartz worktops, riverside apartment', 'quartz-worktops-riverside',
    'Full-length quartz worktops protected from heat marks and staining.',
    'A long galley kitchen with white quartz worktops in a new-build apartment. We applied a satin film across 9 metres of worktop, with seamless joins at the hob and sink.',
    c_worktops, 'Battersea, London', '2026-07-03', 'Quartz worktops', 'Satin clear protective film',
    u || '1556911220-bff31c812dba' || q, 'Modern kitchen with white quartz worktops', 'published', true, 1)
  returning id into p;
  insert into public.project_media (project_id, media_type, storage_path, alt_text, display_order) values
    (p, 'image', u || '1565538810643-b5bdb714032a' || q, 'Galley kitchen', 0),
    (p, 'image', u || '1484154218962-a197022b5858' || q, 'Worktop and splashback', 1),
    (p, 'image', u || '1556185781-a47769abb7ee' || q, 'Kitchen detail', 2);
  insert into public.project_sections (project_id, section_type, heading, content, display_order) values
    (p, 'image_text', 'Seamless at every join', jsonb_build_object('image', jsonb_build_object('path', u || '1556020685-ae41abfc9365' || q, 'alt', 'Worktop join detail'), 'body', 'Joins are positioned along natural lines in the stone so they disappear, even under raking light.', 'imagePosition', 'left'), 0),
    (p, 'specifications', 'Specification', '{"items": [{"label": "Surface", "value": "White quartz"}, {"label": "Film", "value": "Satin clear"}, {"label": "Length", "value": "9.1 m"}]}', 1);

  -- Project 3 ------------------------------------------------------------------
  insert into public.projects (title, slug, short_description, description, category_id, location, completion_date,
    application_type, material_used, cover_image_path, cover_image_alt, status, is_featured, display_order)
  values ('Lacquered cabinetry, family kitchen', 'lacquered-cabinetry-family-kitchen',
    'High-gloss lacquered doors protected from chips, scuffs and fingerprints.',
    'Handleless lacquered cabinetry looks spectacular until little hands and trolley bags arrive. We protected 34 doors and drawer fronts with a self-healing gloss film.',
    c_cabinetry, 'Richmond', '2026-05-21', 'Lacquered cabinet doors', 'Self-healing gloss film',
    u || '1556909114-f6e7ad7d3136' || q, 'Kitchen with lacquered cabinet doors', 'published', true, 2)
  returning id into p;
  insert into public.project_media (project_id, media_type, storage_path, alt_text, display_order) values
    (p, 'image', u || '1604709177225-055f99402ea3' || q, 'Cabinet run', 0),
    (p, 'image', u || '1600489000022-c2086d79f9d4' || q, 'Kitchen overview', 1),
    (p, 'image', u || '1586023492125-27b2c045efd7' || q, 'Living space beyond the kitchen', 2);
  insert into public.project_sections (project_id, section_type, heading, content, display_order) values
    (p, 'text', 'Why self-healing film', '{"body": "Light scuffs on the film disappear with warmth from the sun or warm water, so the gloss stays uniform for years.", "layout": "standard"}', 0),
    (p, 'gallery', 'Details', jsonb_build_object('layout', 'grid', 'images', jsonb_build_array(
      jsonb_build_object('path', u || '1556912173-3bb406ef7e77' || q, 'alt', 'Door edge', 'caption', 'Wrapped edges'),
      jsonb_build_object('path', u || '1565538810643-b5bdb714032a' || q, 'alt', 'Drawer fronts', 'caption', ''),
      jsonb_build_object('path', u || '1484154218962-a197022b5858' || q, 'alt', 'Handleless profile', 'caption', ''))), 1);

  -- Project 4 ------------------------------------------------------------------
  insert into public.projects (title, slug, short_description, description, category_id, location, completion_date,
    application_type, material_used, cover_image_path, cover_image_alt, status, is_featured, display_order)
  values ('Walnut dining table and joinery', 'walnut-dining-table-joinery',
    'A bespoke walnut table and matching joinery protected with an ultra-matte film.',
    'Oiled walnut marks easily. An ultra-matte film preserves the natural, touchable finish while resisting rings and scratches.',
    c_interiors, 'Hampstead, London', '2026-03-10', 'Dining table and joinery', 'Ultra-matte clear film',
    u || '1600210492486-724fe5c67fb0' || q, 'Dining room with a walnut table', 'published', false, 3)
  returning id into p;
  insert into public.project_media (project_id, media_type, storage_path, alt_text, display_order) values
    (p, 'image', u || '1618221195710-dd6b41faaea6' || q, 'Dining space', 0),
    (p, 'image', u || '1615874959474-d609969a20ed' || q, 'Living room joinery', 1);
  insert into public.project_sections (project_id, section_type, heading, content, display_order) values
    (p, 'full_image', null, jsonb_build_object('image', jsonb_build_object('path', u || '1600585154340-be6161a56a0c' || q, 'alt', 'Open-plan interior'), 'caption', 'Matte film keeps the natural grain and feel.'), 0);

  -- Project 5 ------------------------------------------------------------------
  insert into public.projects (title, slug, short_description, description, category_id, location, completion_date,
    application_type, material_used, cover_image_path, cover_image_alt, status, is_featured, display_order)
  values ('Granite worktops, country house', 'granite-worktops-country-house',
    'Dark granite worktops protected without losing their deep polish.',
    'Dark stone shows water marks and limescale. We fitted a high-clarity film that keeps the granite reading as pure, deep black.',
    c_worktops, 'Surrey', '2025-11-18', 'Granite worktops', 'High-clarity gloss film',
    u || '1556185781-a47769abb7ee' || q, 'Country kitchen with dark granite worktops', 'published', false, 4)
  returning id into p;
  insert into public.project_media (project_id, media_type, storage_path, alt_text, display_order) values
    (p, 'image', u || '1556020685-ae41abfc9365' || q, 'Kitchen run', 0),
    (p, 'image', u || '1565538810643-b5bdb714032a' || q, 'Worktop detail', 1);

  -- Project 6 ------------------------------------------------------------------
  insert into public.projects (title, slug, short_description, description, category_id, location, completion_date,
    application_type, material_used, cover_image_path, cover_image_alt, status, is_featured, display_order)
  values ('Vanity tops, boutique hotel', 'vanity-tops-boutique-hotel',
    'Twenty-four marble vanity tops protected for heavy daily hotel use.',
    'Hotel bathrooms see cosmetics, cleaning products and constant use. We protected 24 marble vanities in one week while rooms stayed in service.',
    c_countertops, 'Bath', '2025-09-02', 'Marble vanity tops', 'Satin clear film',
    u || '1600566752355-35792bedcfea' || q, 'Hotel bathroom with marble vanity', 'published', false, 5)
  returning id into p;
  insert into public.project_media (project_id, media_type, storage_path, alt_text, display_order) values
    (p, 'image', u || '1600573472550-8090b5e0745e' || q, 'Bathroom vanity', 0),
    (p, 'image', u || '1617806118233-18e1de247200' || q, 'Hotel interior', 1);

  -- Homepage and About imagery (only fills empty slots) ---------------------
  update public.homepage_sections
     set content = content || jsonb_build_object(
           'image', jsonb_build_object('path', u || '1600585154340-be6161a56a0c' || q, 'alt', 'Light-filled kitchen and living space'),
           'mobileImage', jsonb_build_object('path', u || '1600607687939-ce8a6c25118c' || q, 'alt', 'Kitchen interior'))
   where section_type = 'hero' and (content -> 'image') = 'null'::jsonb;

  update public.homepage_sections
     set content = content || jsonb_build_object(
           'before', jsonb_build_object('path', u || '1556911220-bff31c812dba' || q, 'alt', 'Worktop before protection'),
           'after', jsonb_build_object('path', u || '1600585154526-990dced4db0d' || q, 'alt', 'Worktop after protection'))
   where section_type = 'before_after' and (content -> 'before') = 'null'::jsonb;

  update public.homepage_sections set display_order = display_order + 1 where display_order >= 4;
  insert into public.homepage_sections (section_type, title, content, settings, is_enabled, display_order)
  values ('campaign_banner', 'Campaign', jsonb_build_object(
      'eyebrow', 'New for 2026', 'heading', 'Ultra-matte. Ultra-invisible.',
      'body', 'Our thinnest matte film yet, made for honed stone and natural timber.',
      'image', jsonb_build_object('path', u || '1618221195710-dd6b41faaea6' || q, 'alt', 'Matte interior surfaces'),
      'mobileImage', null, 'cta', jsonb_build_object('label', 'See matte projects', 'href', '/projects?category=interior-surfaces')),
    '{"align": "left", "overlay": 35, "height": "tall"}', true, 4);

  update public.pages
     set content = jsonb_set(jsonb_set(jsonb_set(content,
           '{hero,image}', jsonb_build_object('path', u || '1600210492486-724fe5c67fb0' || q, 'alt', 'Interior with protected surfaces')),
           '{intro,image}', jsonb_build_object('path', u || '1556909114-f6e7ad7d3136' || q, 'alt', 'Kitchen installation')),
           '{story,image}', jsonb_build_object('path', u || '1586023492125-27b2c045efd7' || q, 'alt', 'Studio interior'))
   where page_key = 'about' and (content -> 'hero' -> 'image') = 'null'::jsonb;
end
$$;
