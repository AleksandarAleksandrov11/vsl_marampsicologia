# MARAM Psicología — Landing de reserva

Landing de una sola página para captar primeras sesiones desde anuncios de
Meta (Instagram y Facebook). Proyecto independiente de `marampsicologia.com`,
pensado para vivir en **`vsl.marampsicologia.com`**.

- Sin menú, sin enlaces de salida y sin indexar: la página solo puede acabar en
  el formulario o en WhatsApp.
- **44 KB en la primera carga** (HTML comprimido + imagen del hero + logo). Las
  cinco fotos restantes se cargan solo al llegar a ellas. Sin frameworks ni
  librerías: el CSS y el JavaScript van embebidos en el HTML.
- Misma identidad visual que la web principal: Playfair Display + Inter, tinta
  `#1A1A1A`, crema `#F7F5F3`, logo y fotografías reales de la marca.
- Animada: entrada con la mariposa del logo, apariciones al hacer scroll,
  recorrido de pasos con foto y carrusel de reseñas en movimiento continuo.
- Legal completo y sin salir de la página: banner de cookies que controla el
  píxel, más aviso legal, privacidad y cookies en ventanas emergentes.

---

## 1. Variables de entorno

Todas se configuran en **Vercel → Settings → Environment Variables**. Copia
`.env.example` a `.env.local` si quieres trabajar en local.

### Medición: nada que configurar

El píxel `28380442211594328` y el teléfono `+34 698 994 566` **van por defecto en
el código**, así que cualquier despliegue sale ya midiendo sin tocar nada en
Vercel. Solo necesitas estas variables si algún día quieres cambiarlos:

| Variable | Qué es | Por defecto |
|---|---|---|
| `META_PIXEL_ID` | Otro Píxel de Meta distinto. | `28380442211594328` |
| `WHATSAPP_PHONE` | Otro número de WhatsApp, solo dígitos. | `34698994566` |

> El píxel se instala con el **snippet oficial de Meta en la cabecera**, así que
> Events Manager y la extensión Pixel Helper lo detectan al cargar la página.
> Quien rechace las cookies de medición pasa a `consent revoke` y deja de enviar
> datos; al volver a entrar, la revocación se aplica antes del `PageView`.

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
| `LEAD_WEBHOOK_URL` | URL del Web App de Google Apps Script (la que acaba en `/exec`). Es la única que hace falta. |

Puedes activar **las dos a la vez, una sola o ninguna**. Si no configuras
ninguna, la landing sigue funcionando: el formulario muestra la pantalla de
agradecimiento, el botón de WhatsApp funciona y el lead queda registrado en los
logs de Vercel.

---

## 2. Publicar en `vsl.marampsicologia.com`

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
3. No hace falta configurar ninguna variable para desplegar: el píxel y el
   teléfono van en el código. Las de recepción de leads (sección 3) puedes
   añadirlas después.
4. Pulsa **Deploy**. En un minuto tendrás una URL tipo
   `vsl-marampsicologia.vercel.app` para revisar que todo está bien.

### Paso 3 — Añadir el subdominio en Vercel

1. En el proyecto: **Settings → Domains → Add Domain**.
2. Escribe `vsl.marampsicologia.com` y pulsa **Add**.
3. Vercel mostrará el registro DNS que hay que crear. Anótalo: es lo que tienes
   que pedirle a quien gestione `marampsicologia.com`.

### Paso 4 — Pedir el registro DNS

Este es el mensaje exacto que hay que enviar a quien administre el dominio
(el registrador o el proveedor de hosting de la web principal):

> Necesito publicar una landing en el subdominio `vsl.marampsicologia.com`.
> ¿Podéis añadir este registro en la zona DNS de `marampsicologia.com`?
>
> - **Tipo:** CNAME
> - **Nombre / Host:** `vsl`
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

- [ ] `https://vsl.marampsicologia.com` carga con candado (HTTPS).
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

### Opción B — Google Sheet (gratis, sin cuentas nuevas)

Los leads caen en la hoja **[Leads MARAM](https://docs.google.com/spreadsheets/d/1t_Klc5hUpHqa11r2Od943rkI-rnoamw6zC71yMHEHqE/edit)**
con estas columnas:

| Fecha | Nombre | Teléfono | Motivo de consulta | utm_source | utm_campaign | utm_content | Estado | Importe | Notas |
|---|---|---|---|---|---|---|---|---|---|

Las siete primeras las rellena la web sola. **Estado** entra siempre como
`Nuevo` y tiene desplegable (Contactado, Cita agendada, En proceso, No
contesta, No interesa). **Importe** y **Notas** son vuestras, para ir anotando
según avanza cada persona.

#### Paso 1 — Pegar el script en la hoja

1. Abre la hoja → **Extensiones → Apps Script**.
2. Borra lo que haya en `Código.gs` y pega **todo**
   [`docs/google-sheet.gs`](docs/google-sheet.gs).
3. Guarda con el icono del disquete. No hay nada que editar dentro.

#### Paso 2 — Comprobar que la hoja recibe (sin tocar Vercel)

En la barra de arriba del editor, elige la función **`pruebaDeEscritura`** y
pulsa **Ejecutar**. La primera vez pedirá permisos: acepta. Si sale el aviso de
«app no verificada», pulsa *Configuración avanzada → Ir a (nombre del proyecto)*.
Es tu propio script.

Vuelve a la hoja: debe haber aparecido una fila que empieza por
**«PRUEBA — puedes borrar esta fila»**, con todas las columnas creadas.

> Este paso separa el problema en dos mitades. **Si la fila aparece, la parte
> de Google está perfecta** y lo que queda por arreglar está en Vercel. Si no
> aparece, el fallo está en los permisos del script y no tiene sentido seguir.

#### Paso 3 — Publicarlo como aplicación web

1. Arriba a la derecha: **Implementar → Nueva implementación**.
2. En el engranaje de la izquierda, elige **Aplicación web**.
3. Rellena:
   - *Ejecutar como:* **Yo**
   - *Quién tiene acceso:* **Cualquier usuario** ← si pones otra cosa, no funciona
4. **Implementar** y copia la **URL de la aplicación web**. Acaba en `/exec`.

Pega esa URL en el navegador. Debe responder algo como:

```json
{"ok":true,"mensaje":"Conexión con MARAM lista. Esperando leads."}
```

Si en vez de eso te pide iniciar sesión, vuelve al punto 3 y pon
*Cualquier usuario*.

#### Paso 4 — Darle esa URL a la web (una sola variable)

Esto es lo único que hay que hacer en Vercel:

1. Entra en [vercel.com](https://vercel.com) y abre el proyecto
   **vsl_marampsicologia**.
2. Pestaña **Settings** (arriba) → **Environment Variables** (menú izquierdo).
3. En *Key* escribe exactamente: `LEAD_WEBHOOK_URL`
4. En *Value* pega la URL que acaba en `/exec`.
5. **Deja marcadas las tres casillas**: Production, Preview y Development. Si
   solo marcas Preview, la web publicada seguirá sin recibir nada.
6. **Save**.
7. Ve a la pestaña **Deployments**, en el primero de la lista pulsa los
   **tres puntos (…) → Redeploy → Redeploy**.

> **Este último punto es imprescindible.** Vercel no aplica las variables a lo
> que ya está publicado: solo a los despliegues nuevos. Guardar la variable sin
> redesplegar no cambia nada, y es el motivo número uno de que «no llegue nada».

#### Paso 5 — Comprobar que ya está

Abre <https://vsl.marampsicologia.com/api/lead>. Tiene que decir:

```json
{"canales":{"sheet":"configurado"},"aviso":"Los leads se entregan correctamente."}
```

Ahora rellena el formulario de la web con datos reales. La fila aparece en la
hoja en unos segundos.

#### Qué hacer si no llega la fila

**Empieza siempre por** <https://vsl.marampsicologia.com/api/lead>, que dice a
dónde van los leads ahora mismo sin enseñar ninguna clave.

| Lo que ves | Lo que pasa |
|---|---|
| «NINGÚN CANAL CONFIGURADO» | La variable no está en Vercel, o está pero falta redesplegar (paso 4.7) |
| `sheet: configurado` y la hoja vacía | El script no está publicado, o no como *Cualquier usuario* |
| La URL `/exec` pide iniciar sesión | En el paso 3 no se puso *Cualquier usuario* |
| Llegan filas pero sin `utm_source` | Esa visita entró sin parámetros: es tráfico directo, no de anuncio |

Los logs están en **Vercel → el proyecto → Logs**, filtrando por `/api/lead`.
Cada lead deja una línea que empieza por `[lead]`, así que **aunque fallen la
hoja y el email, ningún lead se pierde**: siempre se puede recuperar de ahí.

### Etiquetar los anuncios para que se llenen los utm

Las columnas `utm_source`, `utm_campaign` y `utm_content` se rellenan con lo
que venga en la URL del anuncio. En Meta Ads Manager, en el campo
**Parámetros de URL** de cada anuncio, pon por ejemplo:

```
utm_source=meta&utm_medium=paid&utm_campaign=ansiedad&utm_content=video1
```

Cambiando `utm_campaign` y `utm_content` por anuncio sabréis, desde la propia
hoja, qué creatividad trae las personas que acaban reservando. Los parámetros
se guardan al entrar, así que siguen ahí aunque tarden en rellenar el
formulario.

---

## 4. Medición con el Píxel de Meta

| Evento | Cuándo se dispara |
|---|---|
| `PageView` | Al cargar la página, desde el snippet de la cabecera. |
| `Lead` | Al enviar el formulario **o** al pulsar cualquier botón de WhatsApp. |
| `consent` | `grant` o `revoke` según lo que se elija en el banner de cookies. |

El evento `Lead` se envía **una sola vez por visita** para no inflar las
métricas, con `value: 45` y `currency: EUR`, e incluye un `eventID` por si más
adelante queréis deduplicar contra la API de Conversiones.

Para optimizar la campaña en Meta: **Events Manager → Custom Conversions**, o
directamente el objetivo *Clientes potenciales* usando el evento `Lead`.

**Cómo comprobarlo:** abre la landing con la extensión *Meta Pixel Helper*.
Debe aparecer el píxel `28380442211594328` con un `PageView`. Rellena el
formulario y verás el `Lead`.

> **Sobre el consentimiento.** El píxel carga y envía el `PageView` nada más
> entrar, igual que en `marampsicologia.com`. El banner de cookies sirve para
> que quien no quiera ser medido pueda cortarlo: al pulsar «Solo necesarias» se
> envía `fbq('consent', 'revoke')` y, en visitas posteriores, esa revocación se
> aplica antes de cualquier evento.
>
> Una lectura estricta del RGPD pediría no enviar nada antes de la aceptación.
> Como este es el mismo criterio que ya sigue la web principal, lo he dejado
> así; si vuestro asesor legal prefiere lo contrario, se cambia moviendo la
> llamada `fbq('track', 'PageView')` del snippet en `scripts/build.mjs` al
> momento de aceptar.
>
> Si más adelante queréis medición independiente del navegador, el camino es la
> **API de Conversiones** enviando los eventos desde `api/lead.js`. El `eventId`
> que ya se genera permite deduplicar el evento del navegador y el del servidor.

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
                    Los textos legales viven en src/index.html, en los <dialog>
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

**Las ocho imágenes de la página están en WebP**, recortadas y recomprimidas
desde el repositorio de la web principal. Suman 135 KB en total y solo la del
hero se carga de entrada. Los cuatro favicons siguen en PNG e ICO a propósito:
ningún navegador garantiza WebP para el icono de pestaña ni para el acceso
directo de iOS.

Para sustituir cualquier foto, deja el archivo en `src/assets/` con el mismo
nombre y vuelve a desplegar.

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

Hay **nueve reseñas, todas reales y publicadas en Google**, con la valoración
media (5,0) y el número de reseñas visibles encima del carrusel. Los nombres se
han abreviado al formato habitual en testimonios (por ejemplo, «María A.») y las
más largas están recortadas en un punto y seguido, sin cambiar ni una palabra.

---

## 7. Cookies y textos legales

### Banner de cookies

Aparece en la primera visita, justo después de la animación de entrada, y
**bloquea el Píxel de Meta hasta que haya consentimiento**. Tiene dos botones:

- **Aceptar todas** → se carga el píxel y se envía `PageView`.
- **Solo necesarias** → no se carga nada de Meta. La landing funciona igual.

La decisión se guarda en `localStorage` bajo `maram_cookie_consent` y se puede
cambiar en cualquier momento desde «Configurar cookies», al final de la página.
Mientras el banner está en pantalla, la barra fija de reservar se oculta para no
apilar dos barras.

### Aviso legal, privacidad y cookies

Los tres textos se abren en **ventanas emergentes sobre la propia página**, no en
páginas aparte: así se cumple la obligación legal sin romper la regla de no tener
enlaces de salida. Están redactados a partir de los de `marampsicologia.com` y
adaptados a lo que esta landing hace realmente (qué datos pide el formulario, qué
proveedores intervienen, cuánto se conservan).

> ### ⚠️ Antes de publicar: cuatro datos que faltan
>
> El aviso legal necesita datos identificativos que no puedo inventar. Están
> marcados con un comentario `PENDIENTE DE COMPLETAR` en `src/index.html`, dentro
> de `<dialog id="modal-aviso">`:
>
> 1. **Razón social exacta** del titular (autónoma, S.L., sociedad civil…).
> 2. **NIF o CIF**.
> 3. **Domicilio** a efectos de notificaciones.
> 4. **Número de registro sanitario del centro**, que la normativa de centros
>    sanitarios obliga a mostrar en la publicidad.
>
> Añade un `<li>` por cada uno y vuelve a desplegar. Y aunque los textos están
> escritos con cuidado, **conviene que los revise quien os lleve la parte legal**:
> yo no soy asesor jurídico y un centro sanitario tiene obligaciones adicionales
> a las de una web normal.

---

## 8. Decisiones que conviene conocer

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
- **La cabecera es fija** y lleva el botón de reservar siempre visible, así que
  el CTA nunca queda fuera de pantalla en ningún punto de la página.
- **Las dudas frecuentes** están al final a propósito: recogen las objeciones que
  más frenan (no saber qué contar, si lo online funciona, la permanencia, el
  encaje con la psicóloga) justo antes del formulario.
- **Validación del teléfono:** 9 dígitos que empiezan por 6, 7, 8 o 9, con el
  prefijo +34 fijo. Se valida en el navegador y otra vez en el servidor.
