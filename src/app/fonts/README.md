# Tipografías

Las dos familias de BIntuitive, servidas desde el propio proyecto con
`next/font/local` (ver `src/app/layout.tsx`). Así el build no sale a Google
Fonts a buscarlas.

| Archivo | Familia | Uso |
|---|---|---|
| `baloo-2-latin.woff2` | [Baloo 2](https://fonts.google.com/specimen/Baloo+2), de Ek Type | Todo el texto: instrucciones, etiquetas, juegos |
| `bricolage-grotesque-latin.woff2` | [Bricolage Grotesque](https://fonts.google.com/specimen/Bricolage+Grotesque), de Mathieu Triay | Solo títulos, por la marca de AUM |

- **Origen.** Son exactamente los archivos que entregaba Google Fonts, en su
  corte latino (`U+0000-00FF` y la puntuación general), que cubre el español y
  el inglés completos.
- **Variables.** Un solo archivo trae todos los grosores. Por eso `layout.tsx`
  declara un rango (`"400 800"` y `"600 800"`) y no una lista de pesos.
- **Licencia.** Las dos se publican con la
  [SIL Open Font License 1.1](https://openfontlicense.org), que permite usarlas,
  incrustarlas y redistribuirlas, también en una aplicación de pago, siempre que
  no se vendan las fuentes por separado. La licencia pide que el aviso de
  copyright y el texto de la OFL acompañen a las fuentes: antes de publicar en
  las tiendas, añadirlos a la pantalla de créditos o licencias de la aplicación.
- **Para añadir un idioma con otro alfabeto** (vietnamita, devanagari,
  latino extendido) hace falta su corte. Se baja de Google Fonts, se añade aquí
  y se suma como otra entrada de `src` en `layout.tsx`.
