import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins = new Set([
  "http://127.0.0.1:5500",
  "http://localhost:5500",
]);
const allowedDomains = [
  "iitb.ac.in", "iitd.ac.in", "smail.iitm.ac.in", "iitk.ac.in",
  "kgpian.iitkgp.ac.in", "iitr.ac.in", "iitg.ac.in", "iith.ac.in",
  "iitbhu.ac.in", "iitism.ac.in", "iitbbs.ac.in", "iitgn.ac.in",
  "iitj.ac.in", "iiti.ac.in", "iitmandi.ac.in", "iitrpr.ac.in",
  "iitp.ac.in", "iitbhilai.ac.in", "iitgoa.ac.in", "iitjammu.ac.in",
  "iitdh.ac.in", "iitpkd.ac.in", "iittp.ac.in",
];
const corsHeaders = {
  "Access-Control-Allow-Origin": "http://127.0.0.1:5500",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};

function json(body: unknown, status = 200, origin = "") {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Access-Control-Allow-Origin": allowedOrigins.has(origin) ? origin : "null", "Content-Type": "application/json", Vary: "Origin" },
  });
}

function isAllowedIITEmail(email: string) {
  const domain = email.split("@")[1] || "";
  return allowedDomains.some(allowed => domain === allowed || domain.endsWith("." + allowed));
}

Deno.serve(async request => {
  const origin = request.headers.get("origin") || "";
  const responseHeaders = { ...corsHeaders, "Access-Control-Allow-Origin": allowedOrigins.has(origin) ? origin : "null", Vary: "Origin" };
  if (request.method === "OPTIONS") return new Response("ok", { headers: responseHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405, origin);
  if (!allowedOrigins.has(origin)) return json({ error: "Origin is not allowed." }, 403, origin);

  try {
    const body = await request.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const action = body?.action;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !isAllowedIITEmail(email)) {
      return json({ error: "Enter a valid IIT email address." }, 400, origin);
    }
    if (action !== "check" && action !== "register") return json({ error: "Invalid action." }, 400, origin);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) return json({ error: "Email registry is not configured." }, 503, origin);
    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });

    const { data: registryRecord, error: registryError } = await admin
      .from("demo_signup_email_registry").select("email").eq("email", email).maybeSingle();
    if (registryError) {
      console.error("Email registry lookup failed:", registryError.message);
      return json({ error: "Could not check registration right now." }, 503, origin);
    }
    let registered = Boolean(registryRecord);

    // Also catch Supabase Auth accounts that existed before this demo registry was added.
    if (!registered) {
      for (let page = 1; page <= 100; page++) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
        if (error) {
          console.error("Auth user lookup failed:", error.message);
          return json({ error: "Could not check registration right now." }, 503, origin);
        }
        const users = data.users || [];
        if (users.some(user => user.email?.toLowerCase() === email)) { registered = true; break; }
        if (users.length < 1000) break;
        if (page === 100) return json({ error: "Registration check reached its user limit." }, 503, origin);
      }
    }

    if (registered || action === "check") return json({ registered }, 200, origin);

    const { error: insertError } = await admin.from("demo_signup_email_registry").insert({ email });
    if (insertError) {
      if (insertError.code === "23505") return json({ registered: true }, 200, origin);
      console.error("Email registry write failed:", insertError.message);
      return json({ error: "Could not reserve this email right now." }, 503, origin);
    }
    return json({ registered: false, reserved: true }, 200, origin);
  } catch (error) {
    console.error("Signup email check failed:", error);
    return json({ error: "Could not check registration right now." }, 500, origin);
  }
});
