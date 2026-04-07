DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Menus are viewable by everyone') THEN
        CREATE POLICY "Menus are viewable by everyone" 
        ON public.menus FOR SELECT 
        USING (TRUE);
    END IF;
END $$;
