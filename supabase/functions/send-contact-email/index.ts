// BGT Services — Contact Form Edge Function
// Deploy via Supabase Dashboard > Edge Functions > New Function
// IMPORTANT: Deploy with verify_jwt DISABLED (this function uses the publishable anon key, not a JWT)
// Add secret: RESEND_API_KEY = your key from https://resend.com
// Change "to" address from ismaelplatt@outlook.com to james@bgtservices.co.uk once tested

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

// ── Rate limiting ────────────────────────────────────────────────────────────
// In-memory per-IP store. Resets on cold start (every few minutes of inactivity).
// Best-effort protection against accidental floods and basic spam bots.
// For stronger quota protection upgrade to Cloudflare Turnstile (no DB needed).
const rateLimitStore = new Map<string, { count: number; windowStart: number }>()
const WINDOW_MS  = 10 * 60 * 1000 // 10-minute window
const MAX_HITS   = 3               // max 3 submissions per IP per window

function checkRateLimit(ip: string): { allowed: boolean; retryAfterSecs?: number } {
  const now = Date.now()
  const entry = rateLimitStore.get(ip)

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    rateLimitStore.set(ip, { count: 1, windowStart: now })
    return { allowed: true }
  }
  if (entry.count >= MAX_HITS) {
    const retryAfterSecs = Math.ceil((WINDOW_MS - (now - entry.windowStart)) / 1000)
    return { allowed: false, retryAfterSecs }
  }
  entry.count++
  return { allowed: true }
}

function cleanStore() {
  const now = Date.now()
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (now - entry.windowStart > WINDOW_MS * 2) rateLimitStore.delete(ip)
  }
}

// ── HTML escape (prevents markup injection in email body) ────────────────────
function esc(s: string): string {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
}

// ── Main handler ─────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  try {
    // Rate limit by IP
    cleanStore()
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown"

    const { allowed, retryAfterSecs } = checkRateLimit(ip)
    if (!allowed) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": String(retryAfterSecs),
          },
        }
      )
    }

    const body = await req.json()
    const { name, email, phone, service, location, message } = body

    // Honeypot — silently drop bot submissions that fill the hidden field
    if (body._hp_website) {
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      )
    }

    // Validation
    if (!name || !email || !phone) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: name, email, phone" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Build email HTML (all user inputs escaped)
    const emailHtml = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#3b6f76;padding:24px;border-radius:8px 8px 0 0;">
          <h1 style="color:white;margin:0;font-size:20px;">New Service Request — BGT Services</h1>
        </div>
        <div style="background:#f8fafc;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;font-weight:600;color:#374151;width:130px;">Name</td>
              <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#111827;">${esc(name)}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;font-weight:600;color:#374151;">Email</td>
              <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;"><a href="mailto:${esc(email)}" style="color:#3b6f76;">${esc(email)}</a></td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;font-weight:600;color:#374151;">Phone</td>
              <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;"><a href="tel:${esc(phone)}" style="color:#3b6f76;">${esc(phone)}</a></td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;font-weight:600;color:#374151;">Service</td>
              <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#111827;">${esc(service || "Not specified")}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;font-weight:600;color:#374151;">Location</td>
              <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#111827;">${esc(location || "Not specified")}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;font-weight:600;color:#374151;vertical-align:top;">Message</td>
              <td style="padding:10px 0;color:#111827;white-space:pre-wrap;">${esc(message || "No message provided")}</td>
            </tr>
          </table>
          <div style="margin-top:24px;padding:16px;background:#e0f2fe;border-radius:6px;font-size:14px;color:#0369a1;">
            <strong>Quick reply:</strong> Hit reply on this email or call
            <a href="tel:${esc(phone)}" style="color:#0369a1;">${esc(phone)}</a>
          </div>
          <p style="color:#9ca3af;font-size:12px;margin-top:16px;">
            Received: ${new Date().toLocaleString("en-GB", { timeZone: "Europe/London" })}
          </p>
        </div>
      </div>
    `

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      },
      body: JSON.stringify({
        from: "noreply@bgtservices.co.uk",    // must be verified in Resend dashboard
        to:   "ismaelplatt@outlook.com",       // TESTING — change to james@bgtservices.co.uk
        reply_to: email,
        subject: `[BGT] New ${esc(service || "General")} enquiry — ${esc(name)}`,
        html: emailHtml,
      }),
    })

    const resendData = await resendRes.json()

    if (!resendRes.ok) {
      console.error("Resend error:", resendData)
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: resendData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: "Email sent", emailId: resendData.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    )
  } catch (error) {
    console.error("Function error:", error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    )
  }
})
