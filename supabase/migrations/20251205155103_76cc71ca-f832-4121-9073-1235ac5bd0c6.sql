-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (bypasses RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Create translations table for CMS
CREATE TABLE public.translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  en TEXT NOT NULL,
  pt TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on translations
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

-- Everyone can read translations
CREATE POLICY "Anyone can read translations"
ON public.translations
FOR SELECT
USING (true);

-- Only admins can modify translations
CREATE POLICY "Admins can insert translations"
ON public.translations
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update translations"
ON public.translations
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete translations"
ON public.translations
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Create global_printers table for admin-managed presets
CREATE TABLE public.global_printers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  purchase_cost NUMERIC NOT NULL DEFAULT 0,
  maintenance_cost NUMERIC NOT NULL DEFAULT 0,
  depreciation_hours NUMERIC NOT NULL DEFAULT 5000,
  power_watts NUMERIC NOT NULL DEFAULT 200,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (brand, model)
);

-- Enable RLS on global_printers
ALTER TABLE public.global_printers ENABLE ROW LEVEL SECURITY;

-- Everyone can read global printers
CREATE POLICY "Anyone can read global printers"
ON public.global_printers
FOR SELECT
USING (true);

-- Only admins can modify global printers
CREATE POLICY "Admins can insert global printers"
ON public.global_printers
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update global printers"
ON public.global_printers
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete global printers"
ON public.global_printers
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at on translations
CREATE TRIGGER update_translations_updated_at
BEFORE UPDATE ON public.translations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on global_printers
CREATE TRIGGER update_global_printers_updated_at
BEFORE UPDATE ON public.global_printers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();