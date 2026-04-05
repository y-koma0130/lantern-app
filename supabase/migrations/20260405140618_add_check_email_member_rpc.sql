-- Check if a given email belongs to an existing member of an organization.
-- Used by the invitation API to avoid auth.admin.listUsers() which doesn't scale.
CREATE OR REPLACE FUNCTION check_email_is_org_member(check_org_id uuid, check_email text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organization_members om
    JOIN auth.users u ON u.id = om.user_id
    WHERE om.org_id = check_org_id
      AND u.email = check_email
  );
$$;
