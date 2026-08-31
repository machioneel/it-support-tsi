import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const FONNTE_TOKEN = Deno.env.get('FONNTE_TOKEN');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    
    // We expect payload from Supabase Database Webhook (insert/update on 'tickets')
    const { type, record, old_record } = payload;
    
    if (!FONNTE_TOKEN) {
      throw new Error("FONNTE_TOKEN is not configured.");
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials are not configured.");
    }

    // Connect to Supabase to fetch user data
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (!record.reporter_id) {
      return new Response("No reporter ID on ticket", { status: 200, headers: corsHeaders });
    }

    // Fetch user phone number
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('contact_number')
      .eq('id', record.reporter_id)
      .single();

    if (userError || !userData || !userData.contact_number) {
      console.log(`Could not find valid contact number for user ${record.reporter_id}`);
      return new Response("No target phone number provided for user", { status: 200, headers: corsHeaders });
    }

    let target = userData.contact_number;
    let message = "";

    // 1. Send chat when a new ticket is received
    if (type === 'INSERT') {
      message = `Halo! Tiket Anda dengan Nomor *${record.ticket_number}* telah kami terima.\n\n` +
                `*Judul:* ${record.issue_title}\n` +
                `*Prioritas:* ${record.priority_level}\n\n` +
                `Tim IT akan segera memproses laporan Anda. Terima kasih!`;
    } 
    // 2. Send chat when the ticket status becomes "Resolved"
    else if (type === 'UPDATE' && record.ticket_status === 'Resolved' && old_record?.ticket_status !== 'Resolved') {
      message = `Halo! Tiket Anda dengan Nomor *${record.ticket_number}* (*${record.issue_title}*) telah diselesaikan oleh tim IT.\n\n` +
                `Jika Anda merasa masalah belum terselesaikan, silakan balas pesan ini atau buka kembali tiket Anda di sistem IT Helpdesk.\n\n` +
                `Terima kasih!`;
    } 
    else {
      // No action needed for other updates
      return new Response("No WhatsApp notification required for this event.", { status: 200, headers: corsHeaders });
    }

    // Call Fonnte API
    const data = new FormData();
    data.append('target', target);
    data.append('message', message);
    data.append('countryCode', '62');

    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        "Authorization": FONNTE_TOKEN.trim(),
      },
      body: data,
    });

    const result = await response.json();
    console.log("Fonnte Response:", result);
    
    return new Response(JSON.stringify({ success: true, result }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });

  } catch (error) {
    console.error("Webhook Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
  }
});
