import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const APP_URL = Deno.env.get("APP_URL") ?? "https://medmate-care-v2.vercel.app";
const PUSH_API_SECRET = Deno.env.get("PUSH_API_SECRET") ?? "";

Deno.serve(async () => {
  if (!PUSH_API_SECRET) {
    return new Response(JSON.stringify({ error: "PUSH_API_SECRET is not configured." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const res = await fetch(`${APP_URL}/api/check-missed-medications`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PUSH_API_SECRET}`,
      "Content-Type": "application/json",
    },
  });

  const body = await res.text();
  return new Response(body, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
});
