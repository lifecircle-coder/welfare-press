-- 1. Create Partnership Inquiries Table
CREATE TABLE IF NOT EXISTS public.partnership_inquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name TEXT NOT NULL,
    contact_person TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    file_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    status TEXT DEFAULT 'pending' -- pending, reviewing, completed
);

-- 2. Enable RLS
ALTER TABLE public.partnership_inquiries ENABLE ROW LEVEL SECURITY;

-- 3. Policies
-- Anyone can insert (public submission)
CREATE POLICY "Enable insert for everyone" ON public.partnership_inquiries
    FOR INSERT WITH CHECK (true);

-- Only authenticated admins/reporters can view
CREATE POLICY "Enable view for admins and reporters" ON public.partnership_inquiries
    FOR SELECT TO authenticated
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'reporter')
    );
