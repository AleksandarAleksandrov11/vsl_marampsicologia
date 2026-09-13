/**
 * Build de la landing: copia src/ a dist/, inyecta las variables de entorno
 * y mete el CSS y el JS dentro del HTML para que la página se pinte con
 * una única petición (clave para el LCP en 4G).
 *
 * Sin dependencias. Se ejecuta con `npm run build`.
 */
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "src");
const DIST = path.join(ROOT, "dist");

const PIXEL_ID = (process.env.META_PIXEL_ID || "").trim();
const PHONE = (process.env.WHATSAPP_PHONE || "34698994566").replace(/\D/g, "");

/**
 * Snippet oficial de Meta, tal cual lo entrega Events Manager, para que el
 * Pixel Helper lo detecte en el código fuente de la página.
 *
 * Matiz de consentimiento: quien ya haya rechazado las cookies de medición
 * entra con `consent revoke` antes del primer evento, así que no se envía
 * nada suyo. El banner cambia ese estado con `grant` o `revoke`.
 */
const pixelSnippet = (id) => `<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${id}');
try{if(localStorage.getItem('maram_cookie_consent')==='rejected')fbq('consent','revoke');}catch(e){}
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none" alt=""
src="https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1"/></noscript>
<!-- End Meta Pixel Code -->`;

/** Minificado conservador: quita comentarios de línea completa e indentación. */
function minifyCss(css) {
  return css
    .replace(/^[ \t]*\/\*[\s\S]*?\*\/[ \t]*$/gm, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}

async function build() {
  await rm(DIST, { recursive: true, force: true });
  await mkdir(DIST, { recursive: true });

  const [html, css, js] = await Promise.all([
    readFile(path.join(SRC, "index.html"), "utf8"),
    readFile(path.join(SRC, "styles.css"), "utf8"),
    readFile(path.join(SRC, "main.js"), "utf8")
  ]);

  // Ojo: se usan funciones de reemplazo, nunca cadenas. En una cadena de
  // reemplazo, "$$" significa un "$" literal y "$&" el texto encontrado, lo
  // que corrompería el JS embebido (por ejemplo el helper $$ de main.js).
  const out = html
    .replace("<!--CSS-->", () => `<style>\n${minifyCss(css)}\n</style>`)
    .replace("<!--JS-->", () => `<script>\n${js}\n</script>`)
    .replace("<!--PIXEL-->", () => (PIXEL_ID ? pixelSnippet(PIXEL_ID) : "<!-- Meta Pixel no configurado -->"))
    .replaceAll("{{META_PIXEL_ID}}", () => PIXEL_ID)
    .replaceAll("{{WHATSAPP_PHONE}}", () => PHONE);

  const leftover = out.match(/\{\{[A-Z_]+\}\}/g);
  if (leftover) throw new Error(`Placeholders sin sustituir: ${[...new Set(leftover)].join(", ")}`);

  // El JS embebido debe ser byte a byte idéntico al de src/main.js.
  if (!out.includes(js)) throw new Error("El JS embebido no coincide con src/main.js");
  if (PIXEL_ID && !out.includes(`fbq('init', '${PIXEL_ID}')`)) {
    throw new Error("El snippet del Píxel de Meta no se ha inyectado en la cabecera");
  }
  if (PIXEL_ID && !out.includes(`pixelId: "${PIXEL_ID}"`)) {
    throw new Error("El ID del Píxel de Meta no se ha inyectado en window.MARAM");
  }

  await writeFile(path.join(DIST, "index.html"), out, "utf8");
  await cp(path.join(SRC, "assets"), path.join(DIST, "assets"), { recursive: true });

  for (const file of ["robots.txt"]) {
    if (existsSync(path.join(SRC, file))) {
      await cp(path.join(SRC, file), path.join(DIST, file));
    }
  }

  const kb = (Buffer.byteLength(out) / 1024).toFixed(1);
  console.log(`✓ dist/index.html  ${kb} KB (CSS y JS embebidos)`);
  console.log(`  Meta Pixel: ${PIXEL_ID ? PIXEL_ID + " (en la cabecera, PageView al cargar)" : "NO configurado (define META_PIXEL_ID)"}`);
  console.log(`  WhatsApp:   +${PHONE}`);
}

build().catch((err) => {
  console.error("✗ Build fallido:", err.message);
  process.exit(1);
});
