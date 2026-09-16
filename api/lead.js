/**
 * POST /api/lead
 *
 * Recibe un lead del formulario de la landing y lo entrega por dos canales
 * opcionales e independientes:
 *
 *   1. Email de notificación vía Resend      → RESEND_API_KEY + LEAD_TO_EMAIL
 *   2. Webhook (Google Sheets / Zapier / …)  → LEAD_WEBHOOK_URL
 *
 * Puedes configurar uno, los dos o ninguno. Si no hay ninguno configurado la
 * función responde 200 y deja el lead en los logs de Vercel, de modo que el
 * formulario y el botón de WhatsApp del front nunca dejan de funcionar.
 *
 * Variables de entorno: ver README.md y .env.example
 */

const MAX_BODY = 8 * 1024; // 8 KB: un lead legítimo nunca se acerca a esto
const WEBHOOK_TIMEOUT = 6000; // ms: por debajo del límite de la función serverless

function readBody(req) {
  if (req.body && typeof req.body === "object") return Promise.resolve(req.body);
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > MAX_BODY) reject(new Error("payload demasiado grande"));
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error("JSON inválido"));
      }
    });
    req.on("error", reject);
  });
}

const clean = (value, max) =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";

function validate(body) {
  const nombre = clean(body.nombre, 60);
  const telefono = clean(body.telefono, 24);
  const motivo = clean(body.motivo, 800);
  const digits = telefono.replace(/\D/g, "").replace(/^34/, "");

  if (nombre.length < 2) return { error: "nombre no válido" };
  if (!/^[6-9]\d{8}$/.test(digits)) return { error: "teléfono no válido" };

  // Parámetros de campaña: solo se aceptan los conocidos y recortados.
  const utmEntrante = body.utm && typeof body.utm === "object" ? body.utm : {};
  const utm = {};
  for (const campo of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid"]) {
    const valor = clean(utmEntrante[campo], 120);
    if (valor) utm[campo] = valor;
  }

  return {
    lead: {
      nombre,
      telefono: `+34 ${digits}`,
      telefonoE164: `+34${digits}`,
      telefonoNacional: digits, // los 9 dígitos, tal cual, para la hoja de cálculo
      motivo,
      origen: clean(body.origen, 60) || "landing-reserva",
      eventId: clean(body.eventId, 80),
      url: clean(body.url, 300),
      referrer: clean(body.referrer, 300),
      recibido: new Date().toISOString(),
      ...utm
    }
  };
}

/** Resumen legible de la campaña para el email de aviso. */
const campana = (lead) =>
  [lead.utm_source, lead.utm_campaign, lead.utm_content].filter(Boolean).join(" · ") || "directo";

/* ---------------------------- canal 1: email ---------------------------- */
async function sendEmail(lead) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_TO_EMAIL;
  if (!key || !to) return { channel: "email", skipped: true };

  const from = process.env.LEAD_FROM_EMAIL || "MARAM Landing <onboarding@resend.dev>";
  const waHref = `https://wa.me/${lead.telefonoE164.replace("+", "")}`;
  const esc = (s) =>
    String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const html = `
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;color:#1A1A1A">
      <h2 style="font-weight:600;margin:0 0 4px">Nueva solicitud de primera sesión</h2>
      <p style="color:#5A5654;margin:0 0 20px;font-size:14px">Origen: ${esc(lead.origen)}</p>
      <table style="width:100%;border-collapse:collapse;font-size:15px">
        <tr><td style="padding:10px 0;border-bottom:1px solid #E7E2DD;color:#5A5654;width:110px">Nombre</td>
            <td style="padding:10px 0;border-bottom:1px solid #E7E2DD"><strong>${esc(lead.nombre)}</strong></td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #E7E2DD;color:#5A5654">Teléfono</td>
            <td style="padding:10px 0;border-bottom:1px solid #E7E2DD"><a href="tel:${esc(lead.telefonoE164)}" style="color:#1A1A1A">${esc(lead.telefono)}</a></td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #E7E2DD;color:#5A5654;vertical-align:top">Motivo</td>
            <td style="padding:10px 0;border-bottom:1px solid #E7E2DD">${esc(lead.motivo) || "<em style='color:#8b8b8b'>No indicado</em>"}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #E7E2DD;color:#5A5654">Campaña</td>
            <td style="padding:10px 0;border-bottom:1px solid #E7E2DD">${esc(campana(lead))}</td></tr>
        <tr><td style="padding:10px 0;color:#5A5654">Recibido</td>
            <td style="padding:10px 0">${esc(lead.recibido)}</td></tr>
      </table>
      <p style="margin:24px 0 0">
        <a href="${esc(waHref)}" style="background:#25D366;color:#08301A;text-decoration:none;padding:12px 20px;display:inline-block;font-weight:600;font-size:14px">Responder por WhatsApp</a>
      </p>
    </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    signal: AbortSignal.timeout(WEBHOOK_TIMEOUT),
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: to.split(",").map((s) => s.trim()).filter(Boolean),
      subject: `Nuevo lead — ${lead.nombre} (${lead.telefono})`,
      html,
      reply_to: process.env.LEAD_REPLY_TO || undefined
    })
  });

  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return { channel: "email", ok: true };
}

/* --------------------- canal 2: webhook / Google Sheet -------------------- */
async function sendWebhook(lead) {
  const url = process.env.LEAD_WEBHOOK_URL;
  if (!url) return { channel: "webhook", skipped: true };

  const token = process.env.LEAD_WEBHOOK_TOKEN;
  const headers = { "Content-Type": "application/json" };
  if (token) headers["X-Lead-Token"] = token;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ ...lead, token: token || undefined }),
    redirect: "follow", // Apps Script redirige a script.googleusercontent.com
    signal: AbortSignal.timeout(WEBHOOK_TIMEOUT)
  });

  const cuerpo = (await res.text()).slice(0, 300);
  if (!res.ok) throw new Error(`Webhook ${res.status}: ${cuerpo}`);

  // Apps Script responde siempre 200, incluso cuando rechaza el token. Sin
  // mirar el cuerpo, un token mal puesto parecería que ha ido bien y los
  // leads se perderían en silencio.
  let datos = null;
  try { datos = JSON.parse(cuerpo); } catch (e) { /* no es JSON: lo damos por bueno */ }
  if (datos && datos.ok === false) {
    throw new Error(`Webhook rechazó el lead: ${datos.error || "sin motivo"}`);
  }

  return { channel: "webhook", ok: true, fila: datos && datos.fila };
}

/* -------------------------------- handler -------------------------------- */
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") return res.status(204).end();

  // Abrir /api/lead en el navegador dice a dónde van los leads ahora mismo,
  // sin revelar ninguna clave. Sirve para comprobar de un vistazo si las
  // variables están puestas en Vercel.
  if (req.method === "GET") {
    const email = Boolean(process.env.RESEND_API_KEY && process.env.LEAD_TO_EMAIL);
    const sheet = Boolean(process.env.LEAD_WEBHOOK_URL);
    return res.status(200).json({
      ok: true,
      canales: {
        email: email ? "configurado" : "sin configurar (faltan RESEND_API_KEY y LEAD_TO_EMAIL)",
        sheet: sheet ? "configurado" : "sin configurar (falta LEAD_WEBHOOK_URL)"
      },
      token: process.env.LEAD_WEBHOOK_TOKEN ? "definido" : "sin definir",
      aviso: email || sheet
        ? "Los leads se entregan correctamente."
        : "NINGÚN CANAL CONFIGURADO: los leads solo quedan en los registros de Vercel."
    });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  let body;
  try {
    body = await readBody(req);
  } catch (err) {
    return res.status(400).json({ ok: false, error: err.message });
  }

  // Campo trampa: si viene relleno es un bot. Respondemos 200 y descartamos.
  if (clean(body.web, 100)) return res.status(200).json({ ok: true, delivered: false });

  const { lead, error } = validate(body);
  if (error) return res.status(422).json({ ok: false, error });

  const results = await Promise.allSettled([sendEmail(lead), sendWebhook(lead)]);

  const configured = results.filter(
    (r) => r.status === "rejected" || !r.value.skipped
  );
  const delivered = results.filter((r) => r.status === "fulfilled" && r.value.ok);
  const failed = results.filter((r) => r.status === "rejected");

  failed.forEach((r) => console.error("[lead] fallo de entrega:", r.reason?.message || r.reason));

  // Siempre dejamos rastro en los logs de Vercel: es la última red de seguridad.
  console.log("[lead]", JSON.stringify({ ...lead, entregado: delivered.length }));

  if (configured.length === 0) {
    console.warn("[lead] sin canal de entrega configurado — revisa RESEND_API_KEY / LEAD_WEBHOOK_URL");
    return res.status(200).json({ ok: true, delivered: false, reason: "sin canal configurado" });
  }

  if (delivered.length === 0) {
    return res.status(502).json({ ok: false, delivered: false, error: "fallo de entrega" });
  }

  return res.status(200).json({ ok: true, delivered: true });
}
