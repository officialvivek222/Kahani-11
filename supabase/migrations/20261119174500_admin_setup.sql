-- 1. Delete user admin@kahanistudio.in from auth.users and its row from user_roles
DELETE FROM public.user_roles 
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'admin@kahanistudio.in');

DELETE FROM auth.users 
WHERE email = 'admin@kahanistudio.in';

-- 2. admin_exists() returns boolean (security definer, search_path = public): true if user_roles has role 'admin'
CREATE OR REPLACE FUNCTION public.admin_exists()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.admin_exists() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_exists() TO anon, authenticated;

-- 3. claim_first_admin() returns boolean (security definer, search_path = public)
CREATE OR REPLACE FUNCTION public.claim_first_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  LOCK TABLE public.user_roles IN EXCLUSIVE MODE;

  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    IF auth.uid() IS NULL THEN
      RETURN false;
    END IF;
    INSERT INTO public.user_roles (user_id, role)
    VALUES (auth.uid(), 'admin');
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_first_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_first_admin() TO authenticated;
