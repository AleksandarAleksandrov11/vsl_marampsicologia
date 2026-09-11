# MARAM Psicología — Landing de reserva

Landing de una sola página para captar primeras sesiones desde anuncios de
Meta (Instagram y Facebook). Proyecto independiente de `marampsicologia.com`,
pensado para vivir en **`reserva.marampsicologia.com`**.

- Sin menú, sin enlaces de salida y sin indexar: la página solo puede acabar en
  el formulario o en WhatsApp.
- **44 KB en la primera carga** (HTML comprimido + imagen del hero + logo). Las
  cinco fotos restantes se cargan solo al llegar a ellas. Sin frameworks ni
  librerías: el CSS y el JavaScript van embebidos en el HTML.
- Misma identidad visual que la web principal: Playfair Display + Inter, tinta
  `#1A1A1A`, crema `#F7F5F3`, logo y fotografías reales de la marca.
- Animada: entrada con la mariposa del logo, apariciones al hacer scroll,
  recorrido de pasos con foto y carrusel de reseñas en movimiento continuo.

---

## 1. Variables de entorno

Todas se configuran en **Vercel → Settings → Environment Variables**. Copia
`.env.example` a `.env.local` si quieres trabajar en local.

### Obligatoria para medir

| Variable | Qué es | Ejemplo |
|---|---|---|
| `META_PIXEL_ID` | ID del Píxel de Meta. Se inyecta en el HTML durante el build. | `1467189831426312` |

> El píxel que ya usa `marampsicologia.com` es el `1467189831426312`. Puedes
> reutilizarlo para tener todo el tráfico en un único píxel, o crear uno nuevo
> en Meta Events Manager si prefieres separar las campañas de esta landing.
> Si dejas la variable vacía la página funciona igual, pero no envía eventos.

### Recepción de leads — opción A: email (recomendada)

| Variable | Qué es |
|---|---|
| `RESEND_API_KEY` | Clave de API de [resend.com](https://resend.com). El plan gratuito cubre 3.000 emails/mes, más que suficiente. |
| `LEAD_TO_EMAIL` | Dónde llegan los avisos. Admite varios separados por comas. Por ejemplo `maram@marampsicologia.com`. |
| `LEAD_FROM_EMAIL` | Remitente. Debe ser de un dominio verificado en Resend. Mientras no verifiques `marampsicologia.com` usa `MARAM Landing <onboarding@resend.dev>`. |
| `LEAD_REPLY_TO` | Opcional. Dirección de respuesta de los avisos. |

### Recepción de leads — opción B: Google Sheet o automatización

| Variable | Qué es |
|---|---|
| `LEAD_WEBHOOK_URL` | URL de un Web App de Google Apps Script, un Zap de Zapier o un escenario de Make. |
| `LEAD_WEBHOOK_TOKEN` | Opcional. Token compartido para que el webhook rechace envíos ajenos. |

Puedes activar **las dos a la vez, una sola o ninguna**. Si no configuras
ninguna, la landing sigue funcionando: el formulario muestra la pantalla de
agradecimiento, el botón de WhatsApp funciona y el lead queda registrado en los
logs de Vercel.

### Otras

| Variable | Por defecto | Qué es |
|---|---|---|
| `WHATSAPP_PHONE` | `34698994566` | Teléfono de WhatsApp, solo dígitos, con prefijo de país. |

---

## 2. Publicar en `reserva.marampsicologia.com`

### Paso 1 — Subir el repositorio a GitHub

Ya está en `AleksandarAleksandrov11/vsl_marampsicologia`. Asegúrate de que la
rama que quieres publicar es la que Vercel va a seguir.

### Paso 2 — Crear el proyecto en Vercel

1. Entra en [vercel.com/new](https://vercel.com/new) e importa el repositorio.
2. Vercel detecta la configuración desde `vercel.json`. Verifica que queda así:
   - **Framework Preset:** `Other`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** déjalo vacío (no hay dependencias)
3. **Antes de pulsar Deploy**, despliega *Environment Variables* y añade al
   menos `META_PIXEL_ID`. Las demás puedes añadirlas después.
4. Pulsa **Deploy**. En un minuto tendrás una URL tipo
   `vsl-marampsicologia.vercel.app` para revisar que todo está bien.

### Paso 3 — Añadir el subdominio en Vercel

1. En el proyecto: **Settings → Domains → Add Domain**.
2. Escribe `reserva.marampsicologia.com` y pulsa **Add**.
3. Vercel mostrará el registro DNS que hay que crear. Anótalo: es lo que tienes
   que pedirle a quien gestione `marampsicologia.com`.

### Paso 4 — Pedir el registro DNS

Este es el mensaje exacto que hay que enviar a quien administre el dominio
(el registrador o el proveedor de hosting de la web principal):

> Necesito publicar una landing en el subdominio `reserva.marampsicologia.com`.
> ¿Podéis añadir este registro en la zona DNS de `marampsicologia.com`?
>
> - **Tipo:** CNAME
> - **Nombre / Host:** `reserva`
> - **Valor / Destino:** `cname.vercel-dns.com.`
> - **TTL:** 3600 (o el valor por defecto)
>
> No toca nada de la web principal: solo crea el subdominio. Cuando esté hecho,
> avisadme para verificarlo.

Notas importantes:

- **Confirma el destino exacto en el panel de Vercel.** Vercel puede pedir
  `cname.vercel-dns.com`, un valor con sufijo regional, o un registro `A` a
  `76.76.21.21`. Usa siempre el que muestre tu panel, no el de este README.
- Si el DNS está en Cloudflare, el registro debe quedar en **DNS only**
  (nube gris), no en modo proxy (nube naranja).
- La propagación tarda de unos minutos a un par de horas. Vercel emite el
  certificado HTTPS automáticamente en cuanto detecta el registro.

### Paso 5 — Comprobaciones finales

Con el subdominio ya activo, repasa esta lista:

- [ ] `https://reserva.marampsicologia.com` carga con candado (HTTPS).
- [ ] En el código fuente aparece `<meta name="robots" content="noindex, nofollow">`.
- [ ] La extensión **Meta Pixel Helper** detecta el píxel y un evento `PageView`.
- [ ] Completa el formulario con datos reales y confirma que llega el email o la fila al Sheet.
- [ ] Meta Pixel Helper registra el evento `Lead` al enviar.
- [ ] El botón de WhatsApp abre la conversación con el mensaje prerrellenado.
- [ ] En el móvil aparece la barra fija al bajar del hero.

---

## 3. Configurar la recepción de leads

### Opción A — Email con Resend (10 minutos)

1. Crea una cuenta en [resend.com](https://resend.com).
2. **API Keys → Create API Key**. Copia la clave y guárdala como
   `RESEND_API_KEY` en Vercel.
3. Define `LEAD_TO_EMAIL` con el correo donde queréis recibir los avisos.
4. Para que el remitente sea del dominio propio, ve a **Domains → Add Domain**,
   añade `marampsicologia.com` y crea los registros DNS que indique Resend
   (SPF y DKIM). Después pon `LEAD_FROM_EMAIL=MARAM Landing <landing@marampsicologia.com>`.
   Mientras tanto funciona con `onboarding@resend.dev`.
5. Vuelve a desplegar para que Vercel tome las variables nuevas.

El aviso llega con el nombre, el teléfono, el motivo y un botón para responder
directamente por WhatsApp.

### Opción B — Google Sheet vía Apps Script (gratis, sin cuentas nuevas)

1. Crea una hoja de cálculo en Google Sheets.
2. **Extensiones → Apps Script** y pega este código:

   ```javascript
   function doPost(e) {
     var TOKEN = 'pon-aqui-un-token-secreto'; // debe coincidir con LEAD_WEBHOOK_TOKEN
     var d = JSON.parse(e.postData.contents);
     if (TOKEN && d.token !== TOKEN) {
       return ContentService.createTextOutput('no autorizado');
     }
     SpreadsheetApp.getActiveSheet().appendRow([
       new Date(), d.nombre, d.telefono, d.motivo, d.origen, d.url, d.referrer
     ]);
     return ContentService.createTextOutput('ok');
   }
   ```

3. **Implementar → Nueva implementación → Aplicación web**.
   - *Ejecutar como:* yo
   - *Quién tiene acceso:* **cualquier usuario**
4. Copia la URL que termina en `/exec` y guárdala como `LEAD_WEBHOOK_URL`.
   Guarda el mismo token como `LEAD_WEBHOOK_TOKEN`.
5. Vuelve a desplegar.

---

## 4. Medición con el Píxel de Meta

| Evento | Cuándo se dispara |
|---|---|
| `PageView` | Al cargar la página. |
| `Lead` | Al enviar el formulario **o** al pulsar cualquier botón de WhatsApp. |

El evento `Lead` se envía **una sola vez por visita** para no inflar las
métricas, con `value: 45` y `currency: EUR`, e incluye un `eventID` por si más
adelante queréis deduplicar contra la API de Conversiones.

Para optimizar la campaña en Meta: **Events Manager → Custom Conversions**, o
directamente el objetivo *Clientes potenciales* usando el evento `Lead`.

> **Sobre el consentimiento de cookies.** El píxel se carga al entrar en la
> página, sin banner previo. La web principal sí tiene banner de cookies, así
> que conviene que lo valoréis con quien os lleve la parte legal: el RGPD y la
> LSSI piden consentimiento previo para las cookies de medición. Si decidís
> añadir banner, la landing está preparada para ello (basta con mover el
> snippet del píxel a una carga condicional en `scripts/build.mjs`).

---

## 5. Desarrollo en local

```bash
npm run build      # genera dist/ con las variables de entorno actuales
npm run preview    # compila y sirve dist/ en http://localhost:3000
```

Para probar también la función serverless `/api/lead` hace falta el CLI de
Vercel:

```bash
npm i -g vercel
vercel dev
```

### Estructura

```
src/index.html      Contenido y estructura de la página
src/styles.css      Sistema de diseño (colores, tipografía, componentes)
src/main.js         Formulario multi-paso, WhatsApp y eventos del píxel
src/assets/         Imágenes optimizadas en WebP (hero, pasos, retratos) y favicons
api/lead.js         Función serverless que recibe y reparte el lead
scripts/build.mjs   Copia src/ a dist/, embebe CSS y JS e inyecta variables
vercel.json         Build, cabeceras de caché y seguridad, X-Robots-Tag
```

**Para cambiar textos** edita `src/index.html`. **Para cambiar colores o
espaciados**, las variables están al principio de `src/styles.css`.

---

## 6. Animaciones y contenido visual

### La mariposa de entrada

Al abrir la página, la mariposa del logo entra volando con las alas batiendo,
se posa en el centro junto al wordmark y la capa se desvanece dejando ver el
hero. Dura **1,6 segundos**.

- Se puede saltar: cualquier toque, clic, tecla o scroll la retira al instante.
- Solo aparece **una vez por sesión**. Si la persona recarga o vuelve, entra
  directa al contenido.
- Se desvanece con una animación CSS de tipo `forwards`, así que la página
  queda visible **aunque el JavaScript falle o no llegue a cargar**.
- Con `prefers-reduced-motion` activado no se muestra.

La mariposa es un SVG dibujado a medida (unos 700 bytes) siguiendo el trazo del
logo. Está en `src/index.html`, dentro de `<div class="intro">`.

**Para cambiar su duración:** ajusta `--intro-delay` en `src/styles.css` y el
retardo de `animation: introOut … 1.55s` en la regla `.intro`. Ambos valores
deben moverse juntos.

### Fotos de la página

| Dónde | Imagen | Origen |
|---|---|---|
| Hero | Escritorio con luz cálida | `hero-maram.webp` de la web principal |
| Paso 1 · Reservas | Portátil sobre el escritorio | recorte de la misma foto |
| Paso 2 · Hablas | María Trinidad y Lucía Zazo | `team-equipo.jpg` |
| Paso 3 · Avanzas | Sala luminosa con sillón | `hero-consultation.jpg` |
| Quién te acompaña | Retratos individuales | `team-maria-trinidad.webp`, `team-lucia.webp` |

Todas se han recortado y recomprimido a WebP desde el repositorio de la web
principal. Para sustituir cualquiera, deja el archivo en `src/assets/` con el
mismo nombre y vuelve a desplegar.

### Carrusel de reseñas

Se desplaza solo hacia la izquierda en bucle continuo y **se detiene al pasar
el ratón por encima o al enfocarlo con el teclado**. El JavaScript duplica las
tarjetas para que el bucle no tenga costura y ajusta la velocidad al número de
reseñas, de modo que no hay nada que tocar al añadir más.

**Para añadir una reseña**, copia un bloque más dentro de `<ul id="marquee-track">`
en `src/index.html`:

```html
<li class="quote">
  <p class="quote__text">Texto literal de la reseña.</p>
  <p class="quote__author">Iniciales<span>Tipo de terapia</span></p>
</li>
```

> **Ahora mismo hay tres reseñas: las tres reales que nos pasaste.** No he
> inventado más para rellenar el carrusel. Atribuir testimonios inventados a
> pacientes sería publicidad engañosa y, en el caso de un servicio sanitario en
> España, está expresamente restringido. En cuanto tengáis más reseñas reales,
> se pegan en ese bloque y el carrusel se adapta solo.

---

## 7. Decisiones que conviene conocer

- **El botón de WhatsApp nunca depende del backend.** Los enlaces `wa.me` se
  construyen en el navegador. Aunque la función serverless falle, se caiga
  Resend o no haya red, el usuario siempre puede escribir por WhatsApp y la
  pantalla de agradecimiento aparece igual (con un límite de 4 segundos de
  espera al backend).
- **No indexable por partida triple:** `<meta name="robots">`, la cabecera
  `X-Robots-Tag` en `vercel.json` y un `robots.txt` que bloquea todo.
- **Anti-spam:** el formulario incluye un campo trampa invisible. Si un bot lo
  rellena, el lead se descarta en el servidor sin avisar al remitente.
- **Accesibilidad:** el formulario se maneja entero con teclado (Enter avanza de
  paso), los errores se anuncian con `role="alert"`, cada paso mueve el foco al
  campo correspondiente y todos los contrastes cumplen WCAG AA como mínimo.
  Con `prefers-reduced-motion` no hay mariposa, ni apariciones, ni carrusel en
  movimiento: el contenido se muestra directamente.
- **La barra fija de móvil lleva los dos caminos:** reservar y WhatsApp, uno al
  lado del otro. Mientras esa barra está a la vista, la burbuja flotante se
  esconde para no duplicar el mismo botón.
- **Validación del teléfono:** 9 dígitos que empiezan por 6, 7, 8 o 9, con el
  prefijo +34 fijo. Se valida en el navegador y otra vez en el servidor.
