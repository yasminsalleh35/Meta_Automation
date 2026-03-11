-- Remove função setup-password do config (função não existe)
-- Esta migração apenas documenta que a função setup-password não existe
-- e remove a entrada stale do config.toml

-- Verificar se a coluna must_change_password já existe (deveria existir)
DO $$
BEGIN
    -- Verificar se o trigger de updated_at existe para profiles
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'set_profiles_updated_at'
        AND event_object_table = 'profiles'
    ) THEN
        -- Criar função se não existir
        CREATE OR REPLACE FUNCTION public.set_updated_at()
        RETURNS TRIGGER 
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = public
        AS $func$
        BEGIN
            NEW.updated_at = now();
            RETURN NEW;
        END;
        $func$;

        -- Criar trigger para profiles
        CREATE TRIGGER set_profiles_updated_at
            BEFORE UPDATE ON public.profiles
            FOR EACH ROW 
            EXECUTE FUNCTION public.set_updated_at();
    END IF;
    
    -- Garantir que RLS policies existam para profiles (apenas se não existirem)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND policyname = 'profiles_self_select'
    ) THEN
        CREATE POLICY "profiles_self_select"
            ON public.profiles FOR SELECT
            USING (auth.uid() = id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND policyname = 'profiles_self_update'
    ) THEN
        CREATE POLICY "profiles_self_update"
            ON public.profiles FOR UPDATE
            USING (auth.uid() = id)
            WITH CHECK (auth.uid() = id);
    END IF;
END
$$;