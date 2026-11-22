-- =============================================================================
-- Baseline content: site settings, pages and a starter homepage.
-- Idempotent (ON CONFLICT DO NOTHING / guarded inserts): safe to re-run and
-- never overwrites edits made in the dashboard.
-- Everything here is placeholder copy, to be edited in /admin.
-- =============================================================================

insert into public.site_settings (key, value) values
  ('brand', '{
    "name": "Strata",
    "tagline": "Invisible protection for beautiful surfaces",
    "logo": null,
    "logoInverse": null,
    "accentColor": "#A47B4F"
  }'),
  ('contact', '{
    "email": "hello@example.com",
    "phone": "+44 20 7946 0000",
    "whatsapp": "",
    "whatsappMessage": "Hello, I would like to ask about surface protection for my project.",
    "address": "Studio 4, 12 Example Street\nLondon",
    "hours": "Mon to Fri, 8:00 to 18:00",
    "mapUrl": ""
  }'),
  ('social', '{ "links": [] }'),
  ('footer', '{
    "description": "Precision-installed protective films for kitchens, cabinetry and interior surfaces.",
    "copyright": "© {year} {brand}. All rights reserved.",
    "showCategories": true
  }'),
  ('seo', '{
    "siteUrl": "",
    "defaultTitle": "Strata | Surface protection portfolio",
    "titleTemplate": "%s | Strata",
    "description": "Completed surface protection projects: kitchen worktops, countertops, cabinetry and interiors protected with invisible films.",
    "ogImage": null
  }'),
  ('navigation', '{
    "showCategoryMenu": true,
    "showCta": true,
    "cta": { "label": "Start a project", "href": "/contact" },
    "showWhatsAppButton": true,
    "projectsLabel": "Projects",
    "categoriesLabel": "Applications"
  }')
on conflict (key) do nothing;

insert into public.pages (page_key, title, seo_title, seo_description, content) values
  ('projects', 'Projects', 'Projects', 'A portfolio of completed surface protection installations.', '{
    "eyebrow": "Portfolio",
    "heading": "Protected. Perfected.",
    "intro": "Every project is a material we respect and a surface we keep as new. Browse completed installations by application.",
    "emptyMessage": "Our latest installations will be published here soon.",
    "enquiryEyebrow": "Start your project",
    "enquiryHeading": "Planning something similar?",
    "enquiryBody": "Tell us about your surfaces and we will recommend the right protection, just as we did for {project}.",
    "enquiryLabel": "Send an enquiry"
  }'),
  ('contact', 'Contact', 'Contact us', 'Talk to us about protecting your surfaces.', '{
    "eyebrow": "Contact",
    "heading": "Let us protect your next surface",
    "intro": "Share a few details about your space and surfaces. We usually reply within one working day.",
    "formHeading": "Send an enquiry",
    "successMessage": "Thank you. We have received your enquiry and will be in touch shortly.",
    "image": null
  }'),
  ('about', 'About', 'About us', 'Specialists in protective films for kitchens, cabinetry and interior surfaces.', '{
    "hero": {
      "eyebrow": "About us",
      "heading": "Craft you can barely see",
      "subtitle": "We protect the surfaces people love: stone, timber, lacquer and laminate, with films applied so precisely they disappear.",
      "image": null
    },
    "intro": {
      "eyebrow": "What we do",
      "heading": "Surface protection, installed with architectural care",
      "body": "We specialise in protective films for kitchen countertops, worktops, cabinetry and interior surfaces.\n\nOur films guard against stains, scratches, heat marks and etching, while keeping the original finish exactly as the designer intended.",
      "image": null
    },
    "story": {
      "eyebrow": "Our story",
      "heading": "Built on one simple idea",
      "body": "Beautiful materials should stay beautiful. We started with a single kitchen and a client who did not want to worry about red wine on marble.\n\nToday we work with homeowners, designers and developers on residential and commercial interiors.",
      "image": null
    },
    "expertise": {
      "eyebrow": "Expertise",
      "heading": "Materials we protect",
      "items": [
        { "title": "Natural stone", "body": "Marble, granite and quartzite protected from etching and staining." },
        { "title": "Engineered surfaces", "body": "Quartz, sintered stone and solid surfaces kept flawless." },
        { "title": "Cabinetry and joinery", "body": "Lacquered, painted and veneered doors guarded against daily wear." }
      ]
    },
    "process": {
      "eyebrow": "How we work",
      "heading": "A considered process",
      "steps": [
        { "title": "Survey", "body": "We assess the material, finish and how the space is used." },
        { "title": "Specify", "body": "We recommend the right film, finish and coverage." },
        { "title": "Install", "body": "Certified installers apply the film with seamless detailing." },
        { "title": "Aftercare", "body": "Clear care guidance and support for years to come." }
      ]
    },
    "values": {
      "eyebrow": "What we value",
      "heading": "Our standards",
      "items": [
        { "title": "Precision", "body": "Edges, seams and cut-outs finished to a standard you have to look hard to find." },
        { "title": "Respect for materials", "body": "We protect the original finish without changing its character." },
        { "title": "Clean installs", "body": "Tidy, efficient work in lived-in homes and live sites." }
      ]
    },
    "gallery": { "images": [] },
    "cta": {
      "heading": "Keep it looking new",
      "body": "Tell us about your surfaces and we will recommend the right protection.",
      "primaryCta": { "label": "Start a project", "href": "/contact" }
    }
  }')
on conflict (page_key) do nothing;

-- Starter homepage (only when the homepage is empty).
insert into public.homepage_sections (section_type, title, content, settings, is_enabled, display_order)
select * from (values
  ('hero', 'Hero', '{
    "eyebrow": "Surface protection studio",
    "heading": "Protect what you love",
    "subtitle": "Invisible protective films for kitchen worktops, countertops, cabinetry and interiors, installed with architectural precision.",
    "image": null, "mobileImage": null, "video": null,
    "primaryCta": { "label": "Explore projects", "href": "/projects" },
    "secondaryCta": { "label": "Contact us", "href": "/contact" }
  }'::jsonb, '{ "align": "left", "overlay": 30, "height": "tall", "useVideo": true }'::jsonb, true, 0),
  ('intro', 'Company introduction', '{
    "eyebrow": "Who we are",
    "heading": "We keep marble, quartz, timber and lacquer looking exactly as the day they were installed, without changing how they look or feel.",
    "body": "From single kitchens to full residential developments, our installers apply protective films so cleanly that the only thing you notice is a surface that stays perfect.",
    "stats": [
      { "value": "1,200+", "label": "Surfaces protected" },
      { "value": "10 yr", "label": "Film durability" },
      { "value": "48 h", "label": "Typical install time" },
      { "value": "100%", "label": "Finish preserved" }
    ],
    "cta": { "label": "About our studio", "href": "/about" }
  }'::jsonb, '{ "background": "white" }'::jsonb, true, 1),
  ('featured_projects', 'Featured projects', '{
    "eyebrow": "Selected work",
    "heading": "Featured projects",
    "description": "Recent installations across kitchens, cabinetry and interiors.",
    "cta": { "label": "View all projects", "href": "/projects" }
  }'::jsonb, '{ "layout": "carousel", "limit": 8, "background": "muted" }'::jsonb, true, 2),
  ('category_showcase', 'Applications', '{
    "eyebrow": "Applications",
    "heading": "Every surface, protected",
    "description": "Explore projects by application."
  }'::jsonb, '{ "layout": "grid", "limit": 8 }'::jsonb, true, 3),
  ('before_after', 'Before and after', '{
    "eyebrow": "See the difference",
    "heading": "Invisible by design",
    "body": "Drag to compare an unprotected surface with one finished in our film.",
    "before": null, "after": null, "beforeLabel": "Before", "afterLabel": "After"
  }'::jsonb, '{ "background": "muted" }'::jsonb, true, 4),
  ('enquiry_cta', 'Enquiry', '{
    "eyebrow": "Start a project",
    "heading": "Ready to protect your surfaces?",
    "body": "Tell us about your space. We will recommend the right film and finish.",
    "cta": { "label": "Send an enquiry", "href": "/contact" },
    "showWhatsApp": true
  }'::jsonb, '{ "theme": "dark" }'::jsonb, true, 5)
) as v(section_type, title, content, settings, is_enabled, display_order)
where not exists (select 1 from public.homepage_sections);
