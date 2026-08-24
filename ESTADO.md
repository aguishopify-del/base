# Estado del proyecto — Skinritual

## Tienda
- Dominio: skinritual-9.myshopify.com
- Nombre: skinritual
- Email: aguishopify@gmail.com
- Plan: Basic — moneda EUR — Spain

## Entorno de trabajo (IMPORTANTE — leer antes de continuar)
Esta sesión corre en un contenedor remoto en la nube (Claude Code on the web),
NO en el ordenador del usuario. Eso cambia cómo se conecta con Shopify:

- **Shopify CLI (`shopify theme ...`, `shopify store auth/execute`) NO
  funciona aquí.** La política de red de este entorno bloquea por completo
  las conexiones directas a cualquier dominio *.shopify.com / *.myshopify.com
  (confirmado: CONNECT 403 en accounts.shopify.com, skinritual-9.myshopify.com
  y cdn.shopify.com). No reintentar por esa vía.
- **La vía que SÍ funciona: el conector MCP de Shopify** (herramientas
  `mcp__Shopify__*`, especialmente `graphql_query` / `graphql_mutation` /
  `graphql_schema` / `validate_graphql_codeblocks`). Va conectado a la tienda
  correcta (verificado con `get-shop-info`). Úsalo para TODO: leer productos,
  leer/crear temas, subir archivos de tema.
- **Cómo se construye y sube el tema sin el CLI:**
  1. El tema base Dawn se clona por git (`git clone
     https://github.com/Shopify/dawn.git`) — git SÍ tiene salida a GitHub.
  2. Para crear un tema nuevo en la tienda: comprimir la carpeta en zip, pedir
     una URL de subida temporal con la mutación `stagedUploadsCreate`
     (resource: FILE) — esa URL es de Google Cloud Storage, no de Shopify, así
     que SÍ es alcanzable con curl directo desde este contenedor — subir el
     zip por POST multipart, y luego llamar a la mutación `themeCreate` con
     `source` = la `resourceUrl` devuelta. Crea el tema como UNPUBLISHED.
  3. Para editar/añadir archivos del tema ya creado: mutación
     `themeFilesUpsert` (máx. 50 archivos por llamada, `themeId` +
     `files: [{filename, body: {type: TEXT, value: "..."}}]`).
  4. **`themePublish` y `themeDelete` están BLOQUEADOS por seguridad en el
     conector MCP.** Cuando la tienda esté lista, el usuario tiene que
     publicar el tema él mismo desde el panel de Shopify (Tienda online >
     Temas > ⋯ > Publicar) — es el único paso manual que le queda. Dale el
     nombre exacto del tema para que lo encuentre fácil.
  5. **No puedo descargar/ver directamente las imágenes de
     `cdn.shopify.com`** (bloqueado igual que el resto de dominios Shopify).
     Esto NO impide que las fotos se vean en la tienda — Liquid las sirve
     directo desde Shopify al visitante — pero si hace falta generar fotos
     nuevas con IA (fase 3b) hay que revisar primero si ese pipeline puede
     alcanzar cdn.shopify.com o si hay que buscar otra vía (quizá subir
     resultados con `stagedUploadsCreate` + `productCreateMedia`, que si
     funciona vía MCP).

## Tema en construcción
- Id: gid://shopify/OnlineStoreTheme/204889588037
- Nombre: "Skinritual - Nueva tienda (borrador)"
- Rol: UNPUBLISHED (a partir de Dawn oficial, recién creado, sin tocar aún)
- Repo de trabajo local: /home/user/base (rama claude/tienda-shopify-v2-fas9ja
  del repo aguishopify-del/base) — aquí vive una copia local de Dawn que se
  va editando y luego subiendo con `themeFilesUpsert`.

### Temas ya existentes en la tienda (no tocar salvo el nuestro)
- Horizon (UNPUBLISHED) — de fábrica, sin usar
- Helio (UNPUBLISHED) — de fábrica, sin usar
- Atelier (UNPUBLISHED) — de fábrica, sin usar
- Helio - Copia de trabajo (MAIN, publicado actualmente)

## Catálogo (sondeo del producto — Fase 1)
La tienda NO tiene un único producto: tiene **17 productos activos**, todos
de la misma categoría — dispositivos y cosmética de skincare/belleza para
rutina en casa, estilo K-beauty:
- Aparatos: mascarilla LED facial 7 colores, ice roller, roller gua sha,
  cepillos limpiadores de silicona (normal, mini, con vibración)
- Cosmética: sérum vitamina C 5en1, dúo vitamina C+retinol, crema
  retinol+colágeno, protectores solares SPF50 (2 modelos), crema reafirmante
  retinol, crema/sérum GHK-Cu, crema ácido kójico, stick cuello/escote,
  crema efecto bótox veneno de abeja, parches de colágeno contorno de ojos

Precios entre 4€ y 55€. Vendor "skinritual" en los 17. Descripciones ya
escritas en español, tono cercano/directo, orientadas a beneficio ("el truco
que usan las makeup artists...", "adiós a las manchas..."). Sin
`productType` ni `tags` rellenos todavía.

No pude inspeccionar las fotos en sí (bloqueo de red a cdn.shopify.com, ver
arriba), pero por descripción y categoría son fotos de producto tipo
proveedor/dropshipping (fondo neutro), no lifestyle editorial.

Conclusión: esto es una MARCA de catálogo (rituales de belleza en casa), no
una tienda de producto único. El plan de la fase 3 se adapta: en vez de una
página de producto "hecha a medida" por producto, se construye UNA plantilla
de producto sólida y reutilizable (que lee los datos reales de cada
producto vía Liquid) + una portada de marca + una página de colección
cuidada, aplicada a los 17 productos.

## Fase actual — PRIMERA ENTREGA COMPLETA (pendiente de que el usuario publique)
- [x] Fase 0 — entorno: Node 22.22.2 y npm ya venían instalados; Shopify CLI
      4.7.0 instalado pero INÚTIL en este entorno (ver bloqueo de red arriba)
- [x] Fase 1 — conexión: hecha vía MCP (no hizo falta login de navegador,
      el conector ya estaba autorizado a la tienda correcta)
- [x] Sondeo de catálogo: 17 productos activos leídos
- [x] Fase 2 — proyecto: Dawn clonado en el repo, tema borrador creado en
      Shopify (UNPUBLISHED) vía stagedUploadsCreate + themeCreate
- [x] Fase 3 — mensaje 2 enviado y aceptado: estilo "ritual de spa en casa"
      confirmado por el usuario tal cual se propuso
- [x/bloqueado] Fase 3b — fotos IA:
  - Clave de Gemini recibida y guardada (`clave-gemini.txt`) — probada:
    responde 429 "quota exceeded, limit 0" para el modelo de imagen en el
    plan gratuito. Gemini NO genera imágenes en plan gratuito, es una
    restricción real de Google, no un fallo nuestro. El usuario decidió NO
    activar facturación por ahora → seguimos con fotos reales del catálogo
    (opción 2 que él mismo eligió).
  - Clave de OpenAI recibida después y guardada (`clave-openai.txt`) —
    probada: `api.openai.com` está BLOQUEADO por la política de red de este
    entorno remoto (CONNECT 403 confirmado en el proxy, igual que los
    dominios de Shopify). No es un problema de la clave: es un bloqueo de
    infraestructura de este contenedor. No reintentar por esa vía.
  - **Conclusión:** en este entorno remoto solo Gemini es alcanzable
    técnicamente, y Gemini requiere facturación activada que el usuario no
    quiere activar ahora mismo. Por tanto NO se generaron fotos con IA en
    esta tanda — la tienda usa las fotos reales ya subidas a los 17
    productos (correcto y suficiente). Si el usuario activa facturación en
    Gemini más adelante, se puede retomar sin fricción (`clave-gemini.txt`
    ya está guardada).
- [x] Fase 4 — secciones personalizadas creadas y subidas:
      skr-hero, skr-rituales, skr-destacado, skr-confianza, skr-productos,
      skr-faq, skr-producto — todas con checklist de editabilidad cumplido
      (textos, imágenes con respaldo, tamaños, alineación, espaciado)
- [x] Fase 5 — completada:
      - Plantilla `product.skr.json` (secciones: producto + faq) asignada
        automáticamente vía Admin API a los 17 productos (`templateSuffix:
        "skr"`, verificado sin userErrors)
      - Header: anuncio superior + menú principal ampliado con las 3
        colecciones nuevas + catálogo + contacto
      - Footer: reescrito con marca (nombre + descripción + redes) y menú de
        navegación propio (incluye legales)
      - 3 colecciones creadas (Dispositivos, Fórmulas Antiedad, Protección
        Solar) + 1 "Más vendidos" para la portada
      - 2 páginas legales creadas y publicadas: Aviso legal
        (/pages/aviso-legal) y Política de cookies
        (/pages/politica-de-cookies) — texto base, avisar al usuario que lo
        revise con su gestoría
      - Favicon propio (SVG, monograma "S") enlazado en `theme.liquid`
      - Colores de marca y radios de botones/tarjetas aplicados en
        `config/settings_data.json` (scheme-1 y scheme-2), así que el
        carrito, buscador y demás piezas nativas de Dawn ya usan la paleta
        de marca
      - Falta (deliberadamente fuera de esta primera tanda, por alcance):
        páginas nativas de Shopify (privacidad/términos/devolución/envío)
        siguen en blanco — el usuario debe rellenarlas desde Configuración →
        Políticas (Shopify trae plantillas, 2 clics)
- [ ] Fase 6 — publicación: el tema está subido y verificado sin errores de
      procesamiento (`processing: false`), pero **no lo he podido revisar
      visualmente yo mismo** (no puedo cargar la tienda en este entorno, ver
      bloqueo de red arriba) — hay que pedirle al usuario que confirme que
      se ve bien antes de publicar. El paso de publicar en sí lo hace el
      usuario a mano (un clic), porque `themePublish` está bloqueado por
      seguridad en el conector MCP.
      - Enlace de vista previa: https://skinritual-9.myshopify.com/?preview_theme_id=204889588037
      - Editor: https://admin.shopify.com/store/skinritual-9/themes/204889588037/editor
      - Nombre del tema en el panel: "Skinritual - Nueva tienda (borrador)"
