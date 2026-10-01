-- The sign-up form has a "7am recap" checkbox. Its value rides along as user
-- metadata (`digest_enabled`), so it's saved even when the account waits on
-- email confirmation. Missing or unreadable metadata keeps the default (on).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, digest_enabled)
  values (
    new.id,
    coalesce(
      case new.raw_user_meta_data->>'digest_enabled'
        when 'false' then false
        when 'true' then true
      end,
      true
    )
  );
  return new;
end;
$$;
