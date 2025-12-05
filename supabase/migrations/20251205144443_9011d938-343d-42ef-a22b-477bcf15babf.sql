-- Create print_templates table for saving reusable configurations
CREATE TABLE public.print_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  printer_id UUID REFERENCES public.printers(id) ON DELETE SET NULL,
  filament_id UUID REFERENCES public.filaments(id) ON DELETE SET NULL,
  electricity_settings_id UUID REFERENCES public.electricity_settings(id) ON DELETE SET NULL,
  preparation_time_minutes NUMERIC DEFAULT 0,
  slicing_time_minutes NUMERIC DEFAULT 0,
  print_start_time_minutes NUMERIC DEFAULT 0,
  remove_from_plate_minutes NUMERIC DEFAULT 0,
  clean_supports_minutes NUMERIC DEFAULT 0,
  additional_work_minutes NUMERIC DEFAULT 0,
  shipping_option_id UUID REFERENCES public.shipping_options(id) ON DELETE SET NULL,
  profit_margin_percent NUMERIC DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.print_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own templates" 
ON public.print_templates FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own templates" 
ON public.print_templates FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates" 
ON public.print_templates FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates" 
ON public.print_templates FOR DELETE 
USING (auth.uid() = user_id);