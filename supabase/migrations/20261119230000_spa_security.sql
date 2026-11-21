ALTER TABLE public.studio_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS published_content ON public.studio_content;
DROP POLICY IF EXISTS admin_content ON public.studio_content;
DROP POLICY IF EXISTS studio_content_select ON public.studio_content;
DROP POLICY IF EXISTS studio_content_all_admin ON public.studio_content;

CREATE POLICY studio_content_select ON public.studio_content
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY studio_content_all_admin ON public.studio_content
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS admin_contacts ON public.contact_submissions;
DROP POLICY IF EXISTS contact_submissions_admin ON public.contact_submissions;

CREATE POLICY contact_submissions_admin ON public.contact_submissions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS admin_quotes ON public.quote_submissions;
DROP POLICY IF EXISTS quote_submissions_admin ON public.quote_submissions;

CREATE POLICY quote_submissions_admin ON public.quote_submissions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS own_profile_read ON public.profiles;
DROP POLICY IF EXISTS own_profile_update ON public.profiles;

CREATE POLICY own_profile_read ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY own_profile_update ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
