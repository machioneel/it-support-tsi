import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { target, message } = await req.json()
    const FONNTE_TOKEN = Deno.env.get('FONNTE_TOKEN')

    if (!FONNTE_TOKEN) {
      throw new Error('FONNTE_TOKEN is not set in Edge Function secrets')
    }

    if (!target || !message) {
      throw new Error('Target and message are required')
    }

    const formData = new FormData()
    formData.append('target', target)
    formData.append('message', message)
    formData.append('countryCode', '62')

    const res = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        "Authorization": FONNTE_TOKEN,
      },
      body: formData,
    })

    const data = await res.json()

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
    )
  }
})
