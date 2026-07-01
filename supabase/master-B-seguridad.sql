-- ════════════════════════════════════════════════════════════════
-- FLUJO MASTER — Fase B: seguridad (RLS + RPCs). REVISAR con cuidado.
-- Requiere haber corrido la Fase A y sembrado el master.
--
-- Cambios:
--  · Se le QUITA a los admin el poder de editar `organizations`
--    (igual no lo usaban: el OrgScreen escribe en `profiles`).
--  · El master puede leer y editar TODAS las organizaciones.
--  · RPC para crear organismo + invitación de admin de forma atómica.
--  · RPC para listar organismos con conteos (para el panel Master).
--
-- Nota: el master NO gana acceso al contenido (evidence/incidents/objectives/
-- tasks) porque esas políticas son is_org_member/is_org_admin y el master no
-- es miembro de ninguna org. Ese límite se mantiene.
--
-- Va en una transacción: si algo falla, se revierte todo.
-- ════════════════════════════════════════════════════════════════
begin;

-- ── 1. organizations: quitar edición a admins, dársela al master ──
drop policy if exists org_update on public.organizations;   -- admins ya no editan

-- El master puede LEER todas las organizaciones (para el panel).
drop policy if exists org_select_master on public.organizations;
create policy org_select_master on public.organizations
  for select using (public.is_platform_admin());

-- El master puede EDITAR cualquier organización.
drop policy if exists org_update_master on public.organizations;
create policy org_update_master on public.organizations
  for update using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- (org_select con is_org_member(id) se mantiene: los miembros leen su org.
--  El INSERT lo hace la RPC de abajo, que es security definer y salta RLS.)

-- ── 2. RPC: crear organismo + invitación del admin (atómico, solo master) ──
create or replace function public.create_organization_with_admin(
  p_org_name              text,
  p_admin_email           text,
  p_org_region            text    default null,
  p_org_ciudad            text    default null,
  p_org_tipo_oiv          text    default null,
  p_org_nivel_complejidad text    default null,
  p_org_usuarios_activos  integer default null,
  p_org_equipo_seguridad  integer default null,
  p_encargado_nombre      text    default null,
  p_encargado_correo      text    default null,
  p_request_id            uuid    default null
)
returns table (org_id uuid, invite_token text)
language plpgsql security definer set search_path = public as $$
declare
  v_org_id uuid;
  v_token  text;
begin
  if not public.is_platform_admin() then
    raise exception 'No autorizado: solo el master puede crear organismos.';
  end if;

  insert into public.organizations (
    name, org_region, org_ciudad, org_tipo_oiv, org_nivel_complejidad,
    org_usuarios_activos, org_equipo_seguridad, encargado_nombre, encargado_correo
  ) values (
    p_org_name, p_org_region, p_org_ciudad, p_org_tipo_oiv, p_org_nivel_complejidad,
    p_org_usuarios_activos, p_org_equipo_seguridad, p_encargado_nombre, p_encargado_correo
  ) returning id into v_org_id;

  -- Invitación del primer admin (usa el default de expires_at de la tabla invites).
  v_token := gen_random_uuid()::text;
  insert into public.invites (org_id, email, role, token, created_by)
    values (v_org_id, lower(p_admin_email), 'admin', v_token, auth.uid());

  -- Si vino de una solicitud del formulario, marcarla aprobada.
  if p_request_id is not null then
    update public.org_requests
       set status = 'approved', processed_at = now()
     where id = p_request_id;
  end if;

  return query select v_org_id, v_token;
end;
$$;

grant execute on function public.create_organization_with_admin to authenticated;

-- ── 3. RPC: listar organismos con conteos (solo master) ──
create or replace function public.list_organizations()
returns table (
  id uuid, name text, org_tipo_oiv text, org_ciudad text,
  members bigint, admins bigint, created_at timestamptz
)
language sql security definer stable set search_path = public as $$
  select o.id, o.name, o.org_tipo_oiv, o.org_ciudad,
    (select count(*) from public.memberships m where m.org_id = o.id),
    (select count(*) from public.memberships m where m.org_id = o.id and m.role = 'admin'),
    o.created_at
  from public.organizations o
  where public.is_platform_admin()
  order by o.created_at desc;
$$;

grant execute on function public.list_organizations to authenticated;

commit;
