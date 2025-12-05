-- Add maintenance_cost column to printers table
ALTER TABLE public.printers ADD COLUMN IF NOT EXISTS maintenance_cost numeric NOT NULL DEFAULT 0;

-- Add depreciation_hours column to printers table (alternative to months)
ALTER TABLE public.printers ADD COLUMN IF NOT EXISTS depreciation_hours numeric NOT NULL DEFAULT 5000;

-- Add brand column to filaments table if not exists
ALTER TABLE public.filaments ADD COLUMN IF NOT EXISTS brand text;

-- Create labor_settings table for preparation and post-processing costs
CREATE TABLE IF NOT EXISTS public.labor_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  preparation_rate_per_hour numeric NOT NULL DEFAULT 15,
  post_processing_rate_per_hour numeric NOT NULL DEFAULT 12,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on labor_settings
ALTER TABLE public.labor_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for labor_settings
CREATE POLICY "Users can view their own labor settings" ON public.labor_settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own labor settings" ON public.labor_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own labor settings" ON public.labor_settings
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own labor settings" ON public.labor_settings
  FOR DELETE USING (auth.uid() = user_id);

-- Create consumables table
CREATE TABLE IF NOT EXISTS public.consumables (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  cost numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on consumables
ALTER TABLE public.consumables ENABLE ROW LEVEL SECURITY;

-- RLS policies for consumables
CREATE POLICY "Users can view their own consumables" ON public.consumables
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own consumables" ON public.consumables
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own consumables" ON public.consumables
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own consumables" ON public.consumables
  FOR DELETE USING (auth.uid() = user_id);

-- Create shipping_options table
CREATE TABLE IF NOT EXISTS public.shipping_options (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on shipping_options
ALTER TABLE public.shipping_options ENABLE ROW LEVEL SECURITY;

-- RLS policies for shipping_options
CREATE POLICY "Users can view their own shipping options" ON public.shipping_options
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own shipping options" ON public.shipping_options
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own shipping options" ON public.shipping_options
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own shipping options" ON public.shipping_options
  FOR DELETE USING (auth.uid() = user_id);

-- Add labor and post-processing fields to prints table
ALTER TABLE public.prints ADD COLUMN IF NOT EXISTS preparation_time_minutes numeric DEFAULT 0;
ALTER TABLE public.prints ADD COLUMN IF NOT EXISTS slicing_time_minutes numeric DEFAULT 0;
ALTER TABLE public.prints ADD COLUMN IF NOT EXISTS print_start_time_minutes numeric DEFAULT 0;
ALTER TABLE public.prints ADD COLUMN IF NOT EXISTS remove_from_plate_minutes numeric DEFAULT 0;
ALTER TABLE public.prints ADD COLUMN IF NOT EXISTS clean_supports_minutes numeric DEFAULT 0;
ALTER TABLE public.prints ADD COLUMN IF NOT EXISTS additional_work_minutes numeric DEFAULT 0;
ALTER TABLE public.prints ADD COLUMN IF NOT EXISTS shipping_option_id uuid REFERENCES public.shipping_options(id);
ALTER TABLE public.prints ADD COLUMN IF NOT EXISTS consumables_cost numeric DEFAULT 0;

-- Create trigger for updated_at on new tables
CREATE TRIGGER update_labor_settings_updated_at
  BEFORE UPDATE ON public.labor_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_consumables_updated_at
  BEFORE UPDATE ON public.consumables
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shipping_options_updated_at
  BEFORE UPDATE ON public.shipping_options
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();