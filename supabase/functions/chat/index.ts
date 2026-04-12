import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Sei l'assistente AI personale del CEO di un gruppo di showroom di arredamento (cucine Scavolini, Lube, Creo, Febal Casa, Pensarecasa) in Campania, Italia. Il gruppo ha 9 showroom.

Ti rivolgi al Direttore con rispetto e professionalità. Rispondi sempre in italiano.

Hai accesso ai dati della dashboard CEO che include:
- KPI del giorno (fatturato, margine ~38%, conversione ~22%, preventivi attivi ~47)
- Performance dei 9 negozi (Ottaviano in testa, poi Sant'Arpino, Giugliano, etc.)
- Classifica venditori e dati ingressi
- Presenze HR e marginalità (38.2%)
- Commissioni critiche (giacenze, ritardi consegna)
- Customer satisfaction (4.3/5 stelle)
- Lead e agenzie (127 lead attivi, conversione 34%)
- Mercato e social media
- Strategia e competitor

Quando l'utente chiede di una sezione specifica, fornisci dati dettagliati e analisi.
Quando chiede una "sintesi strategica", fai un riepilogo completo di tutte le aree.
Sii conciso ma informativo. Usa numeri e dati concreti.
Rispondi in modo naturale, come se stessi parlando al Direttore.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
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
