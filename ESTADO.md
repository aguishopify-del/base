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
La tienda NO tiene un único producto: tiene **20 productos activos**, todos
de la misma categoría — dispositivos y cosmética de skincare/belleza para
rutina en casa, estilo K-beauty:
- Aparatos: mascarilla LED facial 7 colores, ice roller, roller gua sha,
  cepillos limpiadores de silicona (normal, mini, con vibración)
- Cosmética: sérum vitamina C 5en1, dúo vitamina C+retinol, crema
  retinol+colágeno, protectores solares SPF50 (2 modelos), crema reafirmante
  retinol, crema/sérum GHK-Cu, crema ácido kójico, stick cuello/escote,
  crema efecto bótox veneno de abeja, parches de colágeno contorno de ojos

Precios entre 4€ y 55€. Vendor "skinritual" en los 20. Descripciones ya
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
cuidada, aplicada a los 20 productos.

## Fase actual
- [x] Fase 0 — entorno: Node 22.22.2 y npm ya venían instalados; Shopify CLI
      4.7.0 instalado pero INÚTIL en este entorno (ver bloqueo de red arriba)
- [x] Fase 1 — conexión: hecha vía MCP (no hizo falta login de navegador,
      el conector ya estaba autorizado a la tienda correcta)
- [x] Sondeo de catálogo: 20 productos leídos
- [x] Fase 2 — proyecto: Dawn clonado en el repo, tema borrador creado en
      Shopify (UNPUBLISHED)
- [ ] Fase 3 — mensaje 2 al usuario: propuesta de estilo + petición de
      confirmación y clave de imágenes IA (pendiente de enviar)
- [ ] Fase 3b — fotos IA (solo si el usuario da clave)
- [ ] Fase 4 — secciones personalizadas
- [ ] Fase 5 — plantilla de producto + páginas legales + header/footer
- [ ] Fase 6 — publicación (recordar: el paso final de publicar el tema lo
      hace el usuario a mano, un clic, porque themePublish está bloqueado)
