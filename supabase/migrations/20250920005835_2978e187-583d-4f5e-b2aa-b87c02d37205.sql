-- Add missing DELETE policy for profiles table
CREATE POLICY "Users can delete their own profile" ON public.profiles
FOR DELETE 
USING (auth.uid() = id);

-- Add audit trigger for profile deletions
CREATE OR REPLACE FUNCTION public.audit_profile_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Log profile deletion for security audit
  PERFORM public.log_security_audit('DELETE', 'profiles', OLD.id, to_jsonb(OLD), NULL);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER audit_profile_deletion_trigger
AFTER DELETE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.audit_profile_deletion();