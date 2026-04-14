import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.103.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Sei l'assistente AI personale del CEO di un gruppo di showroom di arredamento (cucine Scavolini, Lube, Creo, Febal Casa, Pensarecasa) in Campania, Italia. Il gruppo ha 9 showroom.

Ti rivolgi al Direttore con rispetto e professionalità. Rispondi sempre in italiano.

Hai accesso ai dati della dashboard CEO. Quando ti vengono forniti dati aggiuntivi dal sistema (file caricati, fonti web), usali per le tue analisi.

Quando l'utente chiede di una sezione specifica, fornisci dati dettagliati e analisi.
Sii conciso ma informativo. Usa numeri e dati concreti.
Rispondi in modo naturale, come se stessi parlando al Direttore.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, mode, dashboardData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Fetch data sources from DB
    let dataContext = "";
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data: sources } = await supabase
        .from("data_sources")
        .select("*")
        .eq("is_active", true);

      if (sources && sources.length > 0) {
        dataContext += "\n\nFonti dati configurate dall'utente:\n";
        for (const s of sources) {
          dataContext += `- ${s.name}: ${s.url} (${s.description || 'nessuna descrizione'})\n`;
        }
      }
    } catch (e) {
      console.error("Error fetching data sources:", e);
    }

    // Build system message based on mode
    let systemContent = SYSTEM_PROMPT + dataContext;
    
    if (mode === "punto_situazione") {
      systemContent += `\n\nMODALITÀ: PUNTO DELLA SITUAZIONE
Devi leggere TUTTI i dati della dashboard e fare un report completo e dettagliato.
Inizia con: "Salve Direttore, leggo le notizie di oggi."
Poi analizza ogni area: KPI, negozi, venditori, HR, commissioni critiche, lead, mercato, strategia.
Sii esaustivo e usa tutti i dati disponibili.`;
      if (dashboardData) {
        systemContent += `\n\nDATI DASHBOARD ATTUALI:\n${dashboardData}`;
      }
    } else if (mode === "conversazione") {
      systemContent += `\n\nMODALITÀ: CONVERSAZIONE LIBERA
Inizia con: "Salve Direttore, cosa posso fare per lei?"
Poi rispondi alle domande dell'utente in modo naturale.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemContent },
          ...messages,
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Troppi richieste, riprova tra poco." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crediti esauriti." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Errore AI gateway" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Mi dispiace, non ho capito.";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Errore sconosciuto" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
