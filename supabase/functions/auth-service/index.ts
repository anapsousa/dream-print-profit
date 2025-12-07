import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// This edge function is deprecated - the app uses Supabase Auth directly
// Keeping minimal handler for backwards compatibility

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  return new Response(
    JSON.stringify({ 
      message: "This auth service is deprecated. Please use Supabase Auth directly." 
    }),
    {
      status: 410,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});
