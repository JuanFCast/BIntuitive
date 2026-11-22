-- Borrar la propia cuenta desde la aplicación.
--
-- Apple lo exige a toda aplicación que deje crear cuentas, y Google Play pide
-- un camino claro para borrarla. Borrar un usuario de `auth.users` solo lo
-- puede hacer un administrador; esta función lo hace en nombre de quien la
-- llama y **solo para su propia cuenta**: no recibe ningún id, usa
-- `auth.uid()`, así que nadie puede borrar a otro.
--
-- La fila de `profiles` se va sola con la cuenta (`on delete cascade`). Lo que
-- vive en el dispositivo —progreso, perfil local, preferencias— no es de la
-- cuenta y no se toca.
--
-- Se ejecuta una vez, en el SQL Editor del proyecto (o con `supabase db push`).

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Hace falta una sesión abierta para borrar la cuenta'
      using errcode = 'insufficient_privilege';
  end if;

  delete from auth.users where id = auth.uid();
end;
$$;

-- Solo quien tiene sesión puede llamarla; sin sesión ni siquiera se ve.
revoke all on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;
