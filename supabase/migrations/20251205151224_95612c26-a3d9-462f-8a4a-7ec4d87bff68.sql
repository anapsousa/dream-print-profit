-- Create print_filaments junction table for multiple filaments per print
CREATE TABLE public.print_filaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  print_id UUID NOT NULL REFERENCES public.prints(id) ON DELETE CASCADE,
  filament_id UUID NOT NULL REFERENCES public.filaments(id) ON DELETE CASCADE,
  grams_used NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.print_filaments ENABLE ROW LEVEL SECURITY;

-- RLS policies - users can only access filaments for their own prints
CREATE POLICY "Users can view filaments for their prints"
ON public.print_filaments FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.prints WHERE prints.id = print_filaments.print_id AND prints.user_id = auth.uid()
));

CREATE POLICY "Users can insert filaments for their prints"
ON public.print_filaments FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.prints WHERE prints.id = print_filaments.print_id AND prints.user_id = auth.uid()
));

CREATE POLICY "Users can update filaments for their prints"
ON public.print_filaments FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.prints WHERE prints.id = print_filaments.print_id AND prints.user_id = auth.uid()
));

CREATE POLICY "Users can delete filaments for their prints"
ON public.print_filaments FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.prints WHERE prints.id = print_filaments.print_id AND prints.user_id = auth.uid()
));

-- Migrate existing data from prints table to print_filaments
INSERT INTO public.print_filaments (print_id, filament_id, grams_used)
SELECT id, filament_id, filament_used_grams
FROM public.prints
WHERE filament_id IS NOT NULL AND filament_used_grams > 0;