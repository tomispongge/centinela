-- ════════════════════════════════════════════════════════════════
-- FLUJO MASTER — Fase H: regenerar la invitación del admin pendiente
-- Genera un token nuevo para el MISMO correo de admin (cuando el admin no
-- alcanzó a confirmar y el link se perdió o expiró). Solo master. Transacción.
-- ════════════════════════════════════════════════════════════════
begin;

create or replace function public.regenerate_admin_invite(p_org_id uuid)
returns table (invite_token text, email text)
language plpgsql security definer set search_path = public as $$
declare v_email text; v_token text;
begin
  if not public.is_platform_admin() then
    raise exception 'No autorizado.';
  end if;

  -- Correo de la invitación de admin pendiente (sin usar) más reciente.
  select i.email into v_email from public.invites i
    where i.org_id = p_org_id and i.role = 'admin' and i.used = false
    order by i.created_at desc limit 1;
  if v_email is null then
    raise exception 'No hay una invitación de admin pendiente para este organismo.';
  end if;

  -- Reemplaza las pendientes por una nueva (token y expiración frescos).
  delete from public.invites where org_id = p_org_id and role = 'admin' and used = false;
  v_token := gen_random_uuid()::text;
  insert into public.invites (org_id, email, role, token, created_by)
    values (p_org_id, v_email, 'admin', v_token, auth.uid());

  return query select v_token, v_email;
end; $$;

grant execute on function public.regenerate_admin_invite to authenticated;

commit;
