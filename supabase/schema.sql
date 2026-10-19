-- Run this once in Supabase SQL Editor before starting the website.
create extension if not exists pgcrypto;

create table if not exists public.site_settings (
  id integer primary key check (id = 1),
  settings jsonb not null default '{}'::jsonb check (jsonb_typeof(settings) = 'object'),
  updated_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  location text not null default '',
  category text not null default 'Kegiatan Lainnya',
  event_date date not null,
  cover_url text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  caption text not null default '',
  category text not null default 'Kegiatan Lainnya',
  event_date date,
  image_url text not null,
  sort_order integer not null default 0,
  event_id uuid references public.events(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.content_sections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;
alter table public.events enable row level security;
alter table public.gallery_items enable row level security;
alter table public.content_sections enable row level security;

drop policy if exists "Public can read site settings" on public.site_settings;
create policy "Public can read site settings" on public.site_settings for select to anon, authenticated using (true);
drop policy if exists "Admins can manage site settings" on public.site_settings;
create policy "Admins can manage site settings" on public.site_settings for all to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Public can read events" on public.events;
create policy "Public can read events" on public.events for select to anon, authenticated using (true);
drop policy if exists "Admins can manage events" on public.events;
create policy "Admins can manage events" on public.events for all to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Public can read gallery" on public.gallery_items;
create policy "Public can read gallery" on public.gallery_items for select to anon, authenticated using (true);
drop policy if exists "Admins can manage gallery" on public.gallery_items;
create policy "Admins can manage gallery" on public.gallery_items for all to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Public can read content sections" on public.content_sections;
create policy "Public can read content sections" on public.content_sections for select to anon, authenticated using (true);
drop policy if exists "Admins can manage content sections" on public.content_sections;
create policy "Admins can manage content sections" on public.content_sections for all to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-media', 'site-media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read site media" on storage.objects;
create policy "Public can read site media" on storage.objects for select to anon, authenticated
  using (bucket_id = 'site-media');
drop policy if exists "Admins can upload site media" on storage.objects;
create policy "Admins can upload site media" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'site-media'
    and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    and (storage.foldername(name))[1] is null
  );
drop policy if exists "Admins can update site media" on storage.objects;
create policy "Admins can update site media" on storage.objects for update to authenticated
  using (bucket_id = 'site-media' and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check (bucket_id = 'site-media' and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists "Admins can delete site media" on storage.objects;
create policy "Admins can delete site media" on storage.objects for delete to authenticated
  using (bucket_id = 'site-media' and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

grant usage on schema public to anon, authenticated;
grant select on public.site_settings, public.events, public.gallery_items, public.content_sections to anon, authenticated;
grant insert, update, delete on public.site_settings, public.events, public.gallery_items, public.content_sections to authenticated;
