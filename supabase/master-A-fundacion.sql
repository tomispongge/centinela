-- ════════════════════════════════════════════════════════════════
-- FLUJO MASTER — Fase A: fundación (aditivo y seguro)
-- Cyber-Sentinel · Revisar antes de correr.
--
-- Qué hace: agrega columnas del organismo a `organizations`, migra la info
-- desde `profiles`, crea la tabla `platform_admins` (master) + su helper, y
-- crea `org_requests` (cola de solicitudes del Google Form).
--
-- Es ADITIVO: no modifica la RLS de tablas existentes, así que no puede dejar
-- a nadie fuera. La RLS de seguridad (leer/escribir organizations) va en la
-- Fase B, cuando revisemos tus policies actuales.
--
-- Ejecutar en Supabase → SQL Editor. Va en una transacción: si algo falla,
-- se revierte todo.
-- ════════════════════════════════════════════════════════════════
begin;

-- ── 1. Centralizar la info del organismo en `organizations` ─────
alter table public.organizations
  add column if not exists org_region            text,
  add column if not exists org_ciudad            text,
  add column if not exists org_tipo_oiv          text,
  add column if not exists org_nivel_complejidad text,
  add column if not exists org_usuarios_activos  integer,
  add column if not exists org_equipo_seguridad  integer,
  add column if not exists encargado_nombre      text,
  add column if not exists encargado_correo      text;

-- ── 2. Migrar la info existente desde el perfil del admin de cada org ──
update public.organizations o set
  name                  = coalesce(nullif(p.org_name, ''), o.name),
  org_region            = p.org_region,
  org_ciudad            = p.org_ciudad,
  org_tipo_oiv          = p.org_tipo_oiv,
  org_nivel_complejidad = p.org_nivel_complejidad,
  org_usuarios_activos  = p.org_usuarios_activos,
  org_equipo_seguridad  = p.org_equipo_seguridad,
  encargado_nombre      = p.encargado_nombre,
  encargado_correo      = p.encargado_correo
from public.memberships m
join public.profiles p on p.id = m.user_id
where m.org_id = o.id and m.role = 'admin';

-- ── 3. Master (super-admin único). Se siembra a mano (ver abajo) ──
create table if not exists public.platform_admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);
alter table public.platform_admins enable row level security;

-- Helper: ¿el usuario actual es master?
create or replace function public.is_platform_admin()
returns boolean
language sql security definer stable
set search_path = public as $$
  select exists (select 1 from public.platform_admins where user_id = auth.uid());
$$;

-- Solo el master ve la lista; nadie la edita desde la app.
drop policy if exists platform_admins_read on public.platform_admins;
create policy platform_admins_read on public.platform_admins
  for select using (public.is_platform_admin());

-- ── 4. Cola de solicitudes de organismo (llega del Google Form) ──
create table if not exists public.org_requests (
  id                    uuid primary key default gen_random_uuid(),
  org_name              text not null,
  org_region            text,
  org_ciudad            text,
  org_tipo_oiv          text,
  org_nivel_complejidad text,
  org_usuarios_activos  integer,
  org_equipo_seguridad  integer,
  encargado_nombre      text,
  encargado_correo      text,
  admin_email           text not null,
  status                text not null default 'pending',  -- pending | approved | rejected
  created_at            timestamptz default now(),
  processed_at          timestamptz
);
alter table public.org_requests enable row level security;

-- Solo el master ve/gestiona las solicitudes desde la app.
-- La INSERCIÓN la hace el webhook con la service_role key (que salta RLS),
-- no el cliente. Así ninguna persona anónima puede crear solicitudes.
drop policy if exists org_requests_master on public.org_requests;
create policy org_requests_master on public.org_requests
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());

commit;

-- ════════════════════════════════════════════════════════════════
-- ⚠️ PASO MANUAL DESPUÉS DE CORRER LO ANTERIOR: sembrar el master (tú)
--
--   1. Obtén tu user_id:
--        select id, email from auth.users where email = 'TU-CORREO@...';
--   2. Insértalo:
--        insert into public.platform_admins (user_id) values ('<TU_USER_ID>');
--   3. Verifica (logueado con tu cuenta, debe devolver true):
--        select public.is_platform_admin();
-- ════════════════════════════════════════════════════════════════
