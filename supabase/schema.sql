-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    nickname TEXT,
    avatar_url TEXT,
    user_level INT DEFAULT 1 CHECK (user_level IN (1, 8, 9, 10)), -- 1:User, 8:Reporter, 9:Manager, 10:Master
    specialty TEXT, -- 'Childcare', 'Jobs', 'Housing', 'Health', 'Safety' (Nullable)
    account_origin TEXT DEFAULT 'google' CHECK (account_origin IN ('google', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Articles Table
CREATE TABLE public.articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    summary TEXT, -- AI Summary
    content TEXT,
    category TEXT CHECK (category IN ('All', 'Childcare', 'Jobs', 'Housing', 'Health', 'Safety')),
    hashtags TEXT[], -- Array of hashtags
    thumbnail_url TEXT,
    author_id UUID REFERENCES public.profiles(id),
    view_count INT DEFAULT 0,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Public Comments Table (System for Users)
CREATE TABLE public.public_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES public.public_comments(id), -- For nested comments
    like_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Internal Comments Table (Chat for Staff)
CREATE TABLE public.internal_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
    writer_id UUID REFERENCES public.profiles(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Inquiries Table (1:1 Support)
CREATE TABLE public.inquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Nullable for deleted users
    type TEXTToCheck (type IN ('General', 'Report', 'Correction', 'Ad')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    email TEXT, -- Contact email
    answer TEXT, -- Admin reply
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Answered')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    answered_at TIMESTAMP WITH TIME ZONE
);

-- RLS Policies (Draft)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- Allow public read access to published articles
CREATE POLICY "Public articles are viewable by everyone" 
ON public.articles FOR SELECT 
USING (is_published = TRUE);
