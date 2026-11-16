-- Perfiles de BIntuitive.
--
-- Una fila por cuenta, con lo que se pide al registrarse: nombre y fecha de
-- nacimiento. El correo y la contraseña los guarda Supabase en `auth.users` y
-- no se copian aquí.
--
-- La fila la crea un disparador al nacer la cuenta, con los metadatos que
-- envía la aplicación (`full_name`, `birthdate`, `language`). El mismo
-- disparador es la segunda barrera de la edad: la pantalla ya no deja pasar a
-- menores de 18, pero la API de Supabase es pública y se puede llamar sin
-- pasar por la pantalla. Si la fecha falta o da menos de 18 años, el alta
-- entera se deshace.
--
-- Ojo al añadir Google: un alta por OAuth no trae fecha de nacimiento, así que
-- este disparador la rechazaría. Ese día hay que dejar `birthdate` pendiente
-- para esas cuentas y pedirla en la aplicación antes de dejar jugar.
--
-- Se ejecuta una vez, en el SQL Editor del proyecto (o con `supabase db push`).

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(full_name) between 1 and 40),
  birthdate date not null,
  language text not null default 'en' check (language in ('en', 'es')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Una fila por cuenta de BIntuitive: nombre y fecha de nacimiento (solo mayores de 18).';

-- Permisos explícitos, sin fiarse de los que el proyecto dé por defecto: sin
-- sesión no se ve nada; con sesión se lee la fila y se cambian el nombre y el
-- idioma, pero **no la fecha de nacimiento**, que es la que dice si se tiene
-- edad para estar aquí.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, language) on public.profiles to authenticated;

-- Cada cual ve y cambia solo su fila. No hay política de insert ni de delete:
-- la fila la crea el disparador y se va sola con la cuenta (`on delete cascade`).
alter table public.profiles enable row level security;

drop policy if exists "profiles: leer la propia" on public.profiles;
create policy "profiles: leer la propia"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "profiles: cambiar la propia" on public.profiles;
create policy "profiles: cambiar la propia"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  born date;
begin
  begin
    born := (new.raw_user_meta_data ->> 'birthdate')::date;
  exception when others then
    born := null;
  end;

  if born is null or born > (current_date - interval '18 years')::date then
    raise exception 'BIntuitive es solo para mayores de 18 años'
      using errcode = 'check_violation';
  end if;

  insert into public.profiles (id, full_name, birthdate, language)
  values (
    new.id,
    left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)), 40),
    born,
    case when new.raw_user_meta_data ->> 'language' = 'es' then 'es' else 'en' end
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- `updated_at` al día en cada cambio.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();
