-- Create electricity_settings table
CREATE TABLE public.electricity_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contracted_power_kva NUMERIC NOT NULL DEFAULT 3.45,
  price_per_kwh NUMERIC NOT NULL DEFAULT 0.15,
  daily_fixed_cost NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create fixed_expenses table
CREATE TABLE public.fixed_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  monthly_amount NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create printers table
CREATE TABLE public.printers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  purchase_cost NUMERIC NOT NULL DEFAULT 0,
  depreciation_months NUMERIC NOT NULL DEFAULT 24,
  power_watts NUMERIC NOT NULL DEFAULT 200,
  default_electricity_settings_id UUID REFERENCES public.electricity_settings(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create filaments table
CREATE TABLE public.filaments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  material TEXT,
  color TEXT,
  spool_weight_grams NUMERIC DEFAULT 1000,
  spool_cost NUMERIC DEFAULT 0,
  cost_per_gram NUMERIC NOT NULL DEFAULT 0.02,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create prints table
CREATE TABLE public.prints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  printer_id UUID NOT NULL REFERENCES public.printers(id) ON DELETE CASCADE,
  filament_id UUID NOT NULL REFERENCES public.filaments(id) ON DELETE CASCADE,
  electricity_settings_id UUID REFERENCES public.electricity_settings(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  filament_used_grams NUMERIC NOT NULL DEFAULT 0,
  print_time_hours NUMERIC NOT NULL DEFAULT 0,
  extra_manual_costs NUMERIC DEFAULT 0,
  profit_margin_percent NUMERIC DEFAULT 30,
  discount_percent NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_subscriptions table for tracking Stripe subscriptions
CREATE TABLE public.user_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan_type TEXT NOT NULL DEFAULT 'free',
  max_prints INTEGER NOT NULL DEFAULT 15,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.electricity_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixed_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.printers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.filaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for electricity_settings
CREATE POLICY "Users can view their own electricity settings" ON public.electricity_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own electricity settings" ON public.electricity_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own electricity settings" ON public.electricity_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own electricity settings" ON public.electricity_settings FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for fixed_expenses
CREATE POLICY "Users can view their own fixed expenses" ON public.fixed_expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own fixed expenses" ON public.fixed_expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own fixed expenses" ON public.fixed_expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own fixed expenses" ON public.fixed_expenses FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for printers
CREATE POLICY "Users can view their own printers" ON public.printers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own printers" ON public.printers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own printers" ON public.printers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own printers" ON public.printers FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for filaments
CREATE POLICY "Users can view their own filaments" ON public.filaments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own filaments" ON public.filaments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own filaments" ON public.filaments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own filaments" ON public.filaments FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for prints
CREATE POLICY "Users can view their own prints" ON public.prints FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own prints" ON public.prints FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own prints" ON public.prints FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own prints" ON public.prints FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can view their own subscription" ON public.user_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own subscription" ON public.user_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own subscription" ON public.user_subscriptions FOR UPDATE USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_electricity_settings_updated_at BEFORE UPDATE ON public.electricity_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_fixed_expenses_updated_at BEFORE UPDATE ON public.fixed_expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_printers_updated_at BEFORE UPDATE ON public.printers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_filaments_updated_at BEFORE UPDATE ON public.filaments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_prints_updated_at BEFORE UPDATE ON public.prints FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON public.user_subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to initialize user subscription on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_subscriptions (user_id, plan_type, max_prints)
  VALUES (NEW.id, 'free', 15);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to run on new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();