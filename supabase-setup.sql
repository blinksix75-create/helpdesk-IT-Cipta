-- Helpdesk Tiket: penyiapan database Supabase (jalankan SEKALI di SQL Editor).
-- Aman dijalankan ulang.

-- 1. Tabel utama: satu baris berisi seluruh data aplikasi.
create table if not exists public.helpdesk (
  id int primary key,
  rev bigint not null default 0,      -- naik 1 setiap kali data disimpan (dipakai untuk mendeteksi bentrok)
  data jsonb,
  updated_at timestamptz not null default now()
);
insert into public.helpdesk (id) values (1) on conflict (id) do nothing;

-- 2. Arsip otomatis: salinan data lama paling sering 1 kali per jam, disimpan 14 hari.
--    Tidak bisa dibaca dari browser; lihat lewat Table Editor bila perlu memulihkan.
create table if not exists public.helpdesk_arsip (
  id bigserial primary key,
  rev bigint,
  data jsonb,
  dibuat timestamptz not null default now()
);

-- 3. Trigger: menaikkan rev di sisi database dan membuat arsip sebelum data ditimpa.
create or replace function public.helpdesk_sebelum_ubah() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.data is not null
     and not exists (select 1 from public.helpdesk_arsip where dibuat > now() - interval '1 hour') then
    insert into public.helpdesk_arsip (rev, data) values (old.rev, old.data);
    delete from public.helpdesk_arsip where dibuat < now() - interval '14 days';
  end if;
  new.rev := old.rev + 1;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists helpdesk_sebelum_ubah on public.helpdesk;
create trigger helpdesk_sebelum_ubah before update on public.helpdesk
  for each row execute function public.helpdesk_sebelum_ubah();

-- 4. Hak akses: browser (role anon) hanya boleh membaca dan mengubah baris id = 1.
--    Tidak bisa menambah/menghapus baris, dan tidak bisa menyentuh tabel arsip.
alter table public.helpdesk enable row level security;
alter table public.helpdesk_arsip enable row level security;

grant select, update on public.helpdesk to anon;

drop policy if exists "baca helpdesk" on public.helpdesk;
create policy "baca helpdesk" on public.helpdesk for select to anon using (id = 1);

drop policy if exists "ubah helpdesk" on public.helpdesk;
create policy "ubah helpdesk" on public.helpdesk for update to anon using (id = 1) with check (id = 1);
