-- ════════════════════════════════════════════════════════════════
-- FLUJO MASTER — Fase E: gestión de organismos (pausar, cambiar admin, eliminar)
-- Requiere Fases A y B. Revisar antes de correr. Va en transacción.
-- ════════════════════════════════════════════════════════════════
begin;

-- ── 1. Bandera para pausar la visualización de un organismo ──
alter table public.organizations
  add column if not exists suspended boolean not null default false;

-- ── 2. list_organizations: devolver también `suspended` ──
--    ("admin pendiente" se deduce en el cliente: admins = 0)
-- Cambia el tipo de retorno → Postgres exige DROP antes de recrear.
drop function if exists public.list_organizations();
create or replace function public.list_organizations()
returns table (
  id uuid, name text, org_tipo_oiv text, org_ciudad text,
  members bigint, admins bigint, suspended boolean, created_at timestamptz
)
language sql security definer stable set search_path = public as $$
  select o.id, o.name, o.org_tipo_oiv, o.org_ciudad,
    (select count(*) from public.memberships m where m.org_id = o.id),
    (select count(*) from public.memberships m where m.org_id = o.id and m.role = 'admin'),
    o.suspended, o.created_at
  from public.organizations o
  where public.is_platform_admin()
  order by o.created_at desc;
$$;

-- ── 3. Cambiar el admin de un organismo (reemplazo por correo) ──
-- Quita el acceso admin actual + invitaciones admin sin usar, e invita al nuevo.
create or replace function public.change_org_admin(p_org_id uuid, p_new_email text)
returns table (invite_token text)
language plpgsql security definer set search_path = public as $$
declare v_token text;
begin
  if not public.is_platform_admin() then
    raise exception 'No autorizado: solo el master puede cambiar el admin.';
  end if;
  delete from public.memberships where org_id = p_org_id and role = 'admin';
  delete from public.invites     where org_id = p_org_id and role = 'admin' and used = false;
  v_token := gen_random_uuid()::text;
  insert into public.invites (org_id, email, role, token, created_by)
    values (p_org_id, lower(p_new_email), 'admin', v_token, auth.uid());
  return query select v_token;
end;
$$;
grant execute on function public.change_org_admin to authenticated;

-- ── 4. Eliminar organismo + TODO su contenido (irreversible) ──
create or replace function public.delete_organization(p_org_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_platform_admin() then
    raise exception 'No autorizado: solo el master puede eliminar organismos.';
  end if;
  delete from public.tasks        where org_id = p_org_id;
  delete from public.evidence     where org_id = p_org_id;
  delete from public.objectives   where org_id = p_org_id;
  delete from public.incidents    where org_id = p_org_id;
  delete from public.invites      where org_id = p_org_id;
  delete from public.memberships  where org_id = p_org_id;
  delete from public.organizations where id = p_org_id;
end;
$$;
grant execute on function public.delete_organization to authenticated;

commit;

-- Nota: si al eliminar aparece un error de FK mencionando otra tabla
-- (ej. task_evidence), avísame el mensaje y agrego ese delete. La transacción
-- se revierte sola ante el error, así que el organismo NO queda a medias.
