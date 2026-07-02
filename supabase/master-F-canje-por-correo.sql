-- ════════════════════════════════════════════════════════════════
-- FLUJO MASTER — Fase F: canjear invitación pendiente por CORREO
-- Permite que una cuenta EXISTENTE (ya registrada) acepte una invitación
-- nueva dirigida a su correo. Resuelve el caso "re-invito un correo que ya
-- tenía cuenta" (p. ej. tras eliminar y recrear un organismo).
--
-- Seguridad: solo canjea invitaciones cuyo email coincide con el correo
-- verificado del usuario autenticado (auth.jwt). Va en transacción.
-- ════════════════════════════════════════════════════════════════
begin;

create or replace function public.redeem_pending_invite()
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_email text;
  v_inv   record;
begin
  -- Si ya pertenece a un organismo, no hace nada (devuelve el actual).
  if exists (select 1 from public.memberships where user_id = auth.uid()) then
    return (select org_id from public.memberships where user_id = auth.uid() limit 1);
  end if;

  v_email := auth.jwt() ->> 'email';
  if v_email is null then return null; end if;

  -- Invitación válida (sin usar, no expirada) para el correo del usuario.
  select * into v_inv from public.invites
    where lower(email) = lower(v_email) and used = false and expires_at > now()
    order by created_at desc limit 1;
  if v_inv is null then return null; end if;

  insert into public.memberships (user_id, org_id, role)
    values (auth.uid(), v_inv.org_id, v_inv.role);
  update public.invites set used = true where id = v_inv.id;

  return v_inv.org_id;
end;
$$;

grant execute on function public.redeem_pending_invite to authenticated;

commit;
