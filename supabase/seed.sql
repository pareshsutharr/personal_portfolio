-- =============================================================================
-- Seed data — verified information only.
--
-- Rules followed here:
--   * No invented clients, metrics, dates, team sizes, or results.
--   * Unknown values are left NULL and are editable from /admin.
--   * Anything marked [PLACEHOLDER] in a text field is an obvious prompt for
--     the admin to replace. Placeholder-only rows are hidden (is_visible=false).
--   * Technologies are attached to a project only when verified from the
--     project's own codebase or explicitly stated.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- Profile
-- -----------------------------------------------------------------------------
insert into public.profiles (
  full_name, professional_title, short_bio, long_bio, personal_intro, philosophy,
  career_summary, current_focus, what_i_build, looking_for, location, email, phone,
  availability_status, availability_text, years_experience,
  hero_kicker, hero_line_1, hero_line_2, hero_tagline, hero_keywords,
  cta_primary_text, cta_secondary_text
) values (
  'Paresh Suthar',
  'Full Stack Software Engineer',
  'Full Stack Software Engineer building complete digital products from idea to production. Web, mobile, APIs, databases and deployment, across fintech, healthcare, HRMS, CRM and e-commerce.',
  E'I build software end to end. That means the frontend people touch, the APIs and databases behind it, the mobile app in their pocket, and the server it all runs on.\n\nMy work has covered full-stack web applications, mobile applications, fintech and IPO platforms, healthcare apps, HRMS and CRM systems, admin portals, e-commerce, marketplace and rental platforms, travel platforms, corporate websites and third-party integrations. I also handle deployment, infrastructure and technical SEO, so a product is not finished when the code compiles. It is finished when it is live, fast and findable.\n\nI currently work at JBV Share Broker & Fintech / Growth Avenues, where I started as a Full Stack Web Developer Intern and moved into a Full Stack Developer / Executive role.',
  'I don''t just write code. I build and ship complete digital products.',
  'Ship the whole product. Own the frontend, the backend, the database, the deployment and the details in between.',
  'Started with web foundations, moved through frontend and backend development into MERN and API work, then into production systems. Today the focus is fintech, mobile, enterprise applications and infrastructure.',
  'Fintech, mobile and enterprise systems with production-grade infrastructure.',
  'Web applications, mobile applications, admin portals, CRMs, HRMS platforms, APIs, e-commerce and marketplace products, corporate websites and the infrastructure that runs them.',
  'Serious product work: full-stack roles, founder-led products and client projects that need one engineer who can take it from idea to production.',
  'India',
  null,
  null,
  'selected_projects',
  'Available for select projects',
  null,
  'Full Stack Software Engineer',
  'FULL STACK',
  'SOFTWARE ENGINEER',
  'Building digital products from idea → production',
  array['Web', 'Mobile', 'APIs', 'Fintech', 'Enterprise'],
  'View my work',
  'Let''s build something'
);

-- -----------------------------------------------------------------------------
-- Site + SEO settings
-- -----------------------------------------------------------------------------
insert into public.site_settings (
  site_name, contact_email, location, footer_tagline, copyright_text,
  cta_heading, cta_subheading, cta_button_text
) values (
  'Paresh Suthar',
  null,
  'India',
  'Building digital products from idea to production.',
  '© {year} Paresh Suthar. All rights reserved.',
  'Have a project in mind?',
  'Need a developer who can take it from idea to production? Let''s talk.',
  'Let''s talk'
);

insert into public.seo_settings (
  site_title, title_template, meta_description, keywords, og_title, og_description
) values (
  'Paresh Suthar — Full Stack Software Engineer',
  '%s — Paresh Suthar',
  'Paresh Suthar is a Full Stack Software Engineer in India building complete digital products from idea to production: web, mobile, APIs, fintech and enterprise systems.',
  array['Paresh Suthar', 'Full Stack Software Engineer', 'Full Stack Developer India', 'React Developer', 'Next.js Developer', 'React Native Developer', 'Fintech Developer', 'Node.js Developer'],
  'Paresh Suthar — Full Stack Software Engineer',
  'Building digital products from idea to production. Web, mobile, APIs, fintech and enterprise.'
);

-- -----------------------------------------------------------------------------
-- Social links — URLs are not known; rows hidden until edited in admin.
-- -----------------------------------------------------------------------------
insert into public.social_links (platform, username, url, icon, display_order, is_visible) values
  ('github',   null, 'https://github.com/',   'github',   1, false),
  ('linkedin', null, 'https://linkedin.com/', 'linkedin', 2, false);

-- -----------------------------------------------------------------------------
-- Industries
-- -----------------------------------------------------------------------------
insert into public.industries (name, slug, description, icon, display_order) values
  ('Fintech',          'fintech',       'Wealth management, IPO and share-broking products.',  'landmark',       1),
  ('Healthcare',       'healthcare',    'Patient-facing and care-provider applications.',      'heart-pulse',    2),
  ('HR & Enterprise',  'hr-enterprise', 'HRMS, CRM, admin portals and internal tooling.',      'building-2',     3),
  ('E-commerce',       'ecommerce',     'Storefronts, ordering flows and admin back-offices.', 'shopping-bag',   4),
  ('Travel',           'travel',        'Travel platforms and booking experiences.',           'plane',          5),
  ('Marketplace',      'marketplace',   'Rental and multi-vendor marketplace platforms.',      'store',          6),
  ('Manufacturing',    'manufacturing', 'Corporate presence for manufacturing businesses.',    'factory',        7),
  ('Investment',       'investment',    'Investor-facing tools and lead management.',          'trending-up',    8);

-- -----------------------------------------------------------------------------
-- Technologies
-- -----------------------------------------------------------------------------
insert into public.technologies (name, slug, category, color) values
  -- Frontend
  ('React',        'react',        'frontend', '#61DAFB'),
  ('Next.js',      'nextjs',       'frontend', '#FFFFFF'),
  ('Angular',      'angular',      'frontend', '#DD0031'),
  ('JavaScript',   'javascript',   'frontend', '#F7DF1E'),
  ('TypeScript',   'typescript',   'frontend', '#3178C6'),
  ('HTML',         'html',         'frontend', '#E34F26'),
  ('CSS',          'css',          'frontend', '#1572B6'),
  ('Tailwind CSS', 'tailwind',     'frontend', '#06B6D4'),
  ('Bootstrap',    'bootstrap',    'frontend', '#7952B3'),
  -- Backend
  ('Node.js',      'nodejs',       'backend',  '#339933'),
  ('Express',      'express',      'backend',  '#FFFFFF'),
  ('REST APIs',    'rest-apis',    'backend',  '#FF6B35'),
  ('JWT',          'jwt',          'backend',  '#D63AFF'),
  ('RBAC',         'rbac',         'backend',  '#FF6B35'),
  -- Database
  ('MongoDB',      'mongodb',      'database', '#47A248'),
  ('MySQL',        'mysql',        'database', '#4479A1'),
  ('PostgreSQL',   'postgresql',   'database', '#4169E1'),
  ('Supabase',     'supabase',     'database', '#3ECF8E'),
  -- Mobile
  ('React Native', 'react-native', 'mobile',   '#61DAFB'),
  ('Expo',         'expo',         'mobile',   '#FFFFFF'),
  ('Capacitor',    'capacitor',    'mobile',   '#119EFF'),
  -- Infrastructure
  ('VPS',          'vps',          'devops',   '#A0A0A0'),
  ('Nginx',        'nginx',        'devops',   '#009639'),
  ('PM2',          'pm2',          'devops',   '#2B037A'),
  ('CloudPanel',   'cloudpanel',   'devops',   '#A0A0A0'),
  ('Vercel',       'vercel',       'cloud',    '#FFFFFF'),
  ('SSL',          'ssl',          'devops',   '#A0A0A0'),
  ('Domain Management', 'domain-management', 'devops', '#A0A0A0'),
  -- Services / integrations
  ('Firebase',     'firebase',     'services', '#FFCA28'),
  ('Google Authentication', 'google-auth', 'services', '#4285F4'),
  ('Payment Integrations',  'payments',    'fintech',  '#FF6B35'),
  ('UPI',          'upi',          'fintech',  '#FF6B35'),
  ('Financial APIs', 'financial-apis', 'fintech', '#FF6B35'),
  ('FHIR',         'fhir',         'healthcare', '#E3242B'),
  -- Tools
  ('Git',          'git',          'tools',    '#F05032'),
  ('GitHub',       'github',       'tools',    '#FFFFFF'),
  ('Figma',        'figma',        'design',   '#F24E1E'),
  ('Google Search Console', 'google-search-console', 'seo', '#4285F4');

-- -----------------------------------------------------------------------------
-- Skills (mirror of technologies with category grouping; proficiency/years
-- intentionally NULL until set from admin)
-- -----------------------------------------------------------------------------
insert into public.skills (name, category, technology_id, display_order, is_featured)
select t.name, t.category, t.id, row_number() over (order by t.category, t.name), t.slug in ('react','nextjs','nodejs','typescript','react-native','postgresql','supabase','mongodb')
from public.technologies t;

-- -----------------------------------------------------------------------------
-- Projects
-- -----------------------------------------------------------------------------
with ind as (select slug, id from public.industries)
insert into public.projects (
  title, slug, short_description, category, industry_id, company, project_type,
  platforms, status, visibility, featured, display_order
) values
  ('Growth Avenues', 'growth-avenues',
   'Fintech / wealth management platform.',
   'Fintech / Wealth Management', (select id from ind where slug='fintech'),
   'JBV Share Broker & Fintech / Growth Avenues', 'Web application',
   array['Web'], 'published', 'public', true, 1),

  ('Growth Avenues Admin', 'growth-avenues-admin',
   'Enterprise admin portal for the Growth Avenues platform.',
   'Fintech / Enterprise Admin', (select id from ind where slug='fintech'),
   'JBV Share Broker & Fintech / Growth Avenues', 'Admin portal',
   array['Web'], 'published', 'public', false, 2),

  ('Growth Avenues HRMS', 'growth-avenues-hrms',
   'Enterprise HRMS system.',
   'HRMS / Enterprise', (select id from ind where slug='hr-enterprise'),
   'JBV Share Broker & Fintech / Growth Avenues', 'Web application',
   array['Web'], 'published', 'public', true, 3),

  ('Growth Avenues CRM', 'growth-avenues-crm',
   'Enterprise CRM system.',
   'CRM / Enterprise', (select id from ind where slug='hr-enterprise'),
   'JBV Share Broker & Fintech / Growth Avenues', 'Web application',
   array['Web'], 'published', 'public', false, 4),

  ('HRMS Mobile Application', 'hrms-mobile-application',
   'Growth HR — the Android and iOS app for the Growth Avenues HRMS employee self-service portal: attendance, leaves, expenses and salary slips.',
   'Enterprise Mobile / HRMS', (select id from ind where slug='hr-enterprise'),
   'JBV Share Broker & Fintech / Growth Avenues', 'Mobile application',
   array['iOS', 'Android'], 'published', 'public', true, 5),

  ('BEIPOREADY', 'beipoready',
   'IPO / fintech platform.',
   'IPO / Fintech', (select id from ind where slug='fintech'),
   null, 'Web application',
   array['Web'], 'published', 'public', true, 6),

  ('BEIPOREADY Admin', 'beipoready-admin',
   'Lead management and admin portal for BEIPOREADY.',
   'Lead Management / Admin', (select id from ind where slug='investment'),
   null, 'Admin portal',
   array['Web'], 'published', 'public', false, 7),

  ('JustRentIt', 'justrentit',
   'Rental marketplace platform.',
   'Rental / Marketplace', (select id from ind where slug='marketplace'),
   null, 'Web application',
   array['Web'], 'published', 'public', true, 8),

  ('GumiGumi Travel', 'gumigumi-travel',
   'Travel platform.',
   'Travel', (select id from ind where slug='travel'),
   null, 'Web application',
   array['Web'], 'published', 'public', false, 9),

  ('Bhavvya EcoPack', 'bhavvya-ecopack',
   'Corporate website for a manufacturing business.',
   'Manufacturing / Corporate', (select id from ind where slug='manufacturing'),
   null, 'Corporate website',
   array['Web'], 'published', 'public', false, 10),

  ('Biryani Bazar', 'biryani-bazar',
   'Food e-commerce platform with a product admin.',
   'E-commerce / Food', (select id from ind where slug='ecommerce'),
   null, 'E-commerce',
   array['Web'], 'published', 'public', true, 11),

  ('Maeve', 'maeve',
   'Healthcare application with care-provider and admin experiences.',
   'Healthcare', (select id from ind where slug='healthcare'),
   null, 'Mobile + admin',
   array['Android', 'Web'], 'published', 'public', true, 12),

  ('Health & Wellness Application', 'health-wellness-application',
   'Healthcare mobile application.',
   'Healthcare / Mobile', (select id from ind where slug='healthcare'),
   null, 'Mobile application',
   array['Mobile'], 'published', 'public', false, 13),

  ('Biometric Attendance Integration', 'biometric-attendance-integration',
   'Enterprise biometric attendance integration.',
   'Enterprise Integration', (select id from ind where slug='hr-enterprise'),
   null, 'Integration',
   array['Web'], 'published', 'public', false, 14);

-- Verified technology links
--   * React on Growth Avenues / BEIPOREADY / Maeve: stated in the brief.
--   * Biryani Bazar: verified from its codebase (Next.js, React, TypeScript, Supabase, Tailwind).
--   * Maeve: verified from its codebase (React Native, Expo, Supabase, Firebase).
--   * HRMS Mobile Application (Growth HR): verified from its codebase (Capacitor + Firebase + TypeScript).
with p as (select slug, id from public.projects), t as (select slug, id from public.technologies)
insert into public.project_technologies (project_id, technology_id)
select p.id, t.id from (values
  ('growth-avenues', 'react'),
  ('beipoready', 'react'),
  ('maeve', 'react'),
  ('maeve', 'react-native'),
  ('maeve', 'expo'),
  ('maeve', 'supabase'),
  ('maeve', 'firebase'),
  ('biryani-bazar', 'nextjs'),
  ('biryani-bazar', 'react'),
  ('biryani-bazar', 'typescript'),
  ('biryani-bazar', 'supabase'),
  ('biryani-bazar', 'tailwind'),
  ('hrms-mobile-application', 'capacitor'),
  ('hrms-mobile-application', 'firebase'),
  ('hrms-mobile-application', 'typescript')
) v(ps, ts)
join p on p.slug = v.ps
join t on t.slug = v.ts;

-- -----------------------------------------------------------------------------
-- Experience (dates intentionally NULL — edit from admin)
-- -----------------------------------------------------------------------------
insert into public.experiences (
  company, position, employment_type, location, period_label, is_current,
  description, display_order
) values
  ('JBV Share Broker & Fintech / Growth Avenues', 'Full Stack Web Developer Intern', 'internship',
   'India', null, false,
   'Started as a Full Stack Web Developer Intern working on the Growth Avenues product suite.', 1),
  ('JBV Share Broker & Fintech / Growth Avenues', 'Full Stack Developer / Executive', 'full_time',
   'India', null, true,
   'Progressed into a Full Stack Developer / Executive role across web, admin, HRMS, CRM and mobile applications.', 2);

-- -----------------------------------------------------------------------------
-- Education
-- -----------------------------------------------------------------------------
insert into public.education (institution, degree, field, period_label, grade, description, display_order) values
  ('Veer Narmad South Gujarat University', 'BCA', 'Computer Applications', 'Completed 2025', '8.06 / 10 CGPA',
   'Bachelor of Computer Applications.', 1);

-- -----------------------------------------------------------------------------
-- Certifications (issuer / credential details unknown — edit from admin)
-- -----------------------------------------------------------------------------
insert into public.certifications (title, issuer, skills, display_order) values
  ('Azure AI Document Intelligence', null, array['Azure', 'AI', 'Document processing'], 1),
  ('UX/UI Figma',                    null, array['Figma', 'UX', 'UI'],                   2),
  ('Laravel Basics',                 null, array['Laravel', 'PHP'],                      3),
  ('Advanced Cybersecurity',         null, array['Security'],                            4),
  ('Prompt Engineering',             null, array['AI', 'LLMs'],                          5);

-- -----------------------------------------------------------------------------
-- Skill timeline (technology journey)
-- -----------------------------------------------------------------------------
insert into public.skill_milestones (period_label, title, description, start_year, end_year, technologies, display_order) values
  ('2019–2021', 'Web foundations',      'HTML, CSS and JavaScript fundamentals.',                              2019, 2021, array['HTML', 'CSS', 'JavaScript'], 1),
  ('2021–2023', 'Frontend + backend',   'Component-driven frontends and first server-side work.',             2021, 2023, array['React', 'Bootstrap', 'Node.js'], 2),
  ('2023–2024', 'MERN / APIs',          'Full MERN stack, REST APIs, auth and role-based access.',            2023, 2024, array['MongoDB', 'Express', 'React', 'Node.js', 'JWT', 'RBAC'], 3),
  ('2024–2025', 'Production systems',   'Shipping and maintaining real products on real infrastructure.',    2024, 2025, array['Next.js', 'TypeScript', 'PostgreSQL', 'Nginx', 'PM2', 'VPS'], 4),
  ('2025–Present', 'Fintech + mobile + enterprise + infrastructure', 'Fintech platforms, React Native apps, HRMS/CRM systems and deployment.', 2025, null, array['React Native', 'Expo', 'Supabase', 'Financial APIs', 'UPI', 'CloudPanel'], 5);

-- -----------------------------------------------------------------------------
-- Career map
-- -----------------------------------------------------------------------------
insert into public.career_map_steps (label, display_order) values
  ('Learning', 1), ('Development', 2), ('Full Stack', 3), ('Production', 4),
  ('Fintech', 5), ('Mobile', 6), ('Enterprise', 7), ('Software Engineer', 8);

-- -----------------------------------------------------------------------------
-- Services
-- -----------------------------------------------------------------------------
insert into public.services (title, slug, description, icon, featured, display_order) values
  ('Full Stack Development',            'full-stack-development',  'Frontend, backend, database and deployment, delivered as one coherent product.', 'layers',        true,  1),
  ('Web Application Development',       'web-application-development', 'React and Next.js applications built for real usage, not demos.',          'globe',         true,  2),
  ('Mobile App Development',            'mobile-app-development',  'React Native and Expo apps for iOS and Android.',                              'smartphone',    true,  3),
  ('Admin & CRM Development',           'admin-crm-development',   'Admin portals, CRMs and HRMS platforms with roles, permissions and reporting.', 'layout-dashboard', true, 4),
  ('API Development',                   'api-development',         'REST APIs with authentication, RBAC and third-party integrations.',           'braces',        false, 5),
  ('Fintech Development',               'fintech-development',     'Wealth management, IPO and payment flows with financial APIs and UPI.',         'landmark',      false, 6),
  ('Healthcare Application Development','healthcare-development',  'Healthcare and wellness applications, including FHIR-based integrations.',     'heart-pulse',   false, 7),
  ('Deployment & Infrastructure',       'deployment-infrastructure','VPS, Nginx, PM2, CloudPanel, Vercel, SSL and domain management.',             'server',        false, 8),
  ('Technical SEO',                     'technical-seo',           'Metadata, structured data, sitemaps, performance and Search Console.',          'search',        false, 9);

-- -----------------------------------------------------------------------------
-- Stats — counts are computed live from the CMS; "Years building" stays hidden
-- until a verified value is entered from admin.
-- -----------------------------------------------------------------------------
insert into public.stats (label, value, auto_source, display_order, is_visible) values
  ('Projects delivered', '0',  'projects_count',     1, true),
  ('Technologies',       '0',  'technologies_count', 2, true),
  ('Industries',         '0',  'industries_count',   3, true),
  ('Years building',     '[PLACEHOLDER]', 'manual', 4, false);

-- -----------------------------------------------------------------------------
-- Now page
-- -----------------------------------------------------------------------------
insert into public.now_page (currently_building, currently_learning, current_focus, open_to, is_visible) values
  ('[PLACEHOLDER] What you are building right now.',
   '[PLACEHOLDER] What you are learning right now.',
   'Fintech, mobile and enterprise systems with production-grade infrastructure.',
   'Select projects and full-stack opportunities.',
   false);

-- -----------------------------------------------------------------------------
-- Client logos (names only; logo files are uploaded from admin)
-- -----------------------------------------------------------------------------
insert into public.client_logos (name, display_order)
select v.name, v.ord from (values
  ('Growth Avenues', 1), ('JBV Share Broker & Fintech', 2), ('BEIPOREADY', 3), ('JustRentIt', 4),
  ('GumiGumi Travel', 5), ('Bhavvya EcoPack', 6), ('Biryani Bazar', 7), ('Maeve', 8)
) v(name, ord)
where not exists (select 1 from public.client_logos c where c.name = v.name);

commit;
