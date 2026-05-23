
create extension if not exists pgcrypto;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

do $$
declare
  v_uid uuid;
begin
  select id into v_uid from auth.users where lower(email) = lower('SubediD30@uww.edu');

  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email,
      encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated',
      'SubediD30@uww.edu',
      crypt('UWWhitewaterCS@2026!Dept', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Department Admin","user_category":"faculty"}'::jsonb,
      now(), now(),
      '', '', '', ''
    );
  end if;

  update public.profiles
     set account_role = 'admin',
         status = 'active',
         user_category = null,
         accepted_at = coalesce(accepted_at, now()),
         full_name = coalesce(nullif(full_name, ''), 'Department Admin')
   where id = v_uid;

  insert into public.profiles (id, email, full_name, account_role, status, accepted_at)
  select v_uid, 'SubediD30@uww.edu', 'Department Admin', 'admin', 'active', now()
  where not exists (select 1 from public.profiles where id = v_uid);
end $$;
