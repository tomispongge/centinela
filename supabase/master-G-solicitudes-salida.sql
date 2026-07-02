-- ════════════════════════════════════════════════════════════════
-- FLUJO — Fase G: solicitudes de salida del organismo
-- Miembro pide salir → aprueba un admin de su org.
-- Admin pide salir  → aprueba el master.
-- Al aprobar, se elimina la membresía. Va en transacción.
-- ════════════════════════════════════════════════════════════════
begin;

create table if not exists public.leave_requests (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  org_id       uuid not null,
  role         text not null,          -- rol del solicitante al pedir (member|admin)
  email        text,                   -- correo del solicitante (para mostrar al que aprueba)
  status       text not null default 'pending',  -- pending | approved | rejected
  created_at   timestamptz default now(),
  processed_at timestamptz
);
alter table public.leave_requests enable row level security;

-- Ver: el solicitante ve la suya; el admin de la org ve las de su org; el master, todas.
drop policy if exists leave_requests_select on public.leave_requests;
create policy leave_requests_select on public.leave_requests
  for select using (
    user_id = auth.uid() or public.is_org_admin(org_id) or public.is_platform_admin()
  );
-- Insert/update van por las RPCs (security definer), no desde el cliente.

-- ── Solicitar salida (el usuario, de su propio organismo) ──
create or replace function public.request_leave()
returns void language plpgsql security definer set search_path = public as $$
declare v_m record; v_email text;
begin
  select org_id, role into v_m from public.memberships where user_id = auth.uid() limit 1;
  if v_m is null then raise exception 'No perteneces a ningún organismo.'; end if;
  if exists (select 1 from public.leave_requests where user_id = auth.uid() and status = 'pending') then
    return; -- ya hay una pendiente
  end if;
  v_email := auth.jwt() ->> 'email';
  insert into public.leave_requests (user_id, org_id, role, email, status)
    values (auth.uid(), v_m.org_id, v_m.role, v_email, 'pending');
end; $$;
grant execute on function public.request_leave to authenticated;

-- ── Aprobar salida (autoriza según el rol del solicitante) ──
create or replace function public.approve_leave_request(p_request_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_req record;
begin
  select * into v_req from public.leave_requests where id = p_request_id and status = 'pending';
  if v_req is null then raise exception 'Solicitud no encontrada o ya procesada.'; end if;
  if v_req.role = 'admin' then
    if not public.is_platform_admin() then raise exception 'No autorizado.'; end if;
  else
    if not public.is_org_admin(v_req.org_id) then raise exception 'No autorizado.'; end if;
  end if;
  delete from public.memberships where user_id = v_req.user_id and org_id = v_req.org_id;
  update public.leave_requests set status = 'approved', processed_at = now() where id = p_request_id;
end; $$;
grant execute on function public.approve_leave_request to authenticated;

-- ── Rechazar salida (misma autorización) ──
create or replace function public.reject_leave_request(p_request_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_req record;
begin
  select * into v_req from public.leave_requests where id = p_request_id and status = 'pending';
  if v_req is null then raise exception 'Solicitud no encontrada o ya procesada.'; end if;
  if v_req.role = 'admin' then
    if not public.is_platform_admin() then raise exception 'No autorizado.'; end if;
  else
    if not public.is_org_admin(v_req.org_id) then raise exception 'No autorizado.'; end if;
  end if;
  update public.leave_requests set status = 'rejected', processed_at = now() where id = p_request_id;
end; $$;
grant execute on function public.reject_leave_request to authenticated;

commit;
