# Pendientes antes de salir a las tiendas

Lista de lo que falta para publicar BIntuitive en Google Play y el App Store.
Se marca `[x]` al terminar cada cosa. Última revisión: 22 de noviembre de 2026.

## 🔴 Te toca a ti (no se puede hacer desde el código)

- [ ] **Crear el buzón `support@aumcrsp.com`**, o un reenvío a tu correo en GoDaddy.
      Privacidad y Términos ya lo nombran como contacto, y las tiendas lo piden en la
      ficha. Si nadie lo lee, una petición de borrado de datos se queda sin responder.
- [ ] **Cuenta de Google Play Console** ($25, una sola vez).
- [ ] **Cuenta de Apple Developer** ($99 al año). A nombre de AUM Creative Specialists
      LLC hace falta un número **D-U-N-S** (gratis, pero tarda días). Empezar ya.
- [ ] **Que un abogado revise** `/privacy` y `/terms` (texto en `src/data/legal.ts`).
      Son un punto de partida honesto, no asesoría legal.
- [ ] **Probar el borrado de cuenta** con una cuenta de prueba: Perfil → Cuenta →
      "Borrar mi cuenta", y comprobar que desaparece de Supabase → Authentication → Users.
- [ ] **Probar la voz del nivel 4 de Puente de palabras** en un teléfono real (en el
      navegador de pruebas no hay audio).
- [ ] **Pasar Supabase al plan Pro** ($25/mes) antes de lanzar: el plan gratis pausa el
      proyecto tras 7 días sin actividad y el registro dejaría de funcionar.

## 🟡 Limpieza

- [ ] Quitar las dos variables `NEXT_PUBLIC_SUPABASE_*` de la app **aumcrsp** de Amplify
      (Virginia). Ahí no sirven; las buenas están en **BeeSmart** (Ohio).
- [ ] Desconectar del repositorio el proyecto **beesmart** de Vercel, que no se usa y pone
      una marca roja o verde en cada commit.

## 🔵 Construir

- [ ] **App de tienda con Capacitor**, en una rama (`app/capacitor`), sin tocar `main` hasta
      que la web siga funcionando igual.
      - Apple rechaza las apps que son "una web dentro de una caja" (regla 4.2): los archivos
        van dentro de la app, se juega sin conexión como invitado y se siente nativa
        (vibración, icono y pantalla de arranque propios).
      - Decidir si el build de tienda enseña ya las cuentas (`IS_STORE_BUILD`): lo que Apple
        exigía, borrar la cuenta desde la app, ya existe.
- [ ] **Ficha de cada tienda**: icono, capturas, descripción, formulario de datos ("Data
      safety" de Google, "Privacy labels" de Apple) y edad (18+).
- [ ] **Anuncios (AdMob)** al terminar cada 2 o 3 partidas, con el aviso de consentimiento
      y el permiso de seguimiento de iPhone.
- [ ] **Plus a $1,99 al mes** con 7 días gratis (RevenueCat): sin anuncios + Puente de
      palabras con candado, pantalla de suscripción y "Restaurar compras".
- [ ] **Actualizar Privacidad y Términos el mismo día** que entren anuncios o pagos, y mover
      `LEGAL_UPDATED`.
- [ ] **Pantalla de créditos y licencias** dentro de la app: fuentes (OFL, ver
      `src/app/fonts/README.md`) e iconos (Twemoji, CC BY 4.0).

## ⚪ Producto (no bloquea, pero las tiendas comparan contenido y edad)

- [ ] Revisar el contenido para el público adulto: las claves de grado (`pre-k` a
      `grade-3`, en `src/lib/grade.ts`) y las lecciones de contar y de colores.
- [ ] Que las lecciones de preguntas guarden en `byGrade` como los juegos (decidir si
      mantienen la dificultad adaptativa o pasan al selector de niveles).
- [ ] Iniciar sesión con Google (Google no da la fecha de nacimiento: hay que pedirla
      después de entrar y ajustar el disparador de `profiles`).
- [ ] Progreso en la nube, ligado a la cuenta.

## ✅ Hecho

- [x] Cuentas con Supabase, registro en 4 pasos, solo mayores de 18.
- [x] Correo propio con Resend (`no-reply@bintuitive.aumcrsp.com`), sin caer en spam.
- [x] Activación con código de 6 dígitos.
- [x] Borrar la cuenta desde Perfil.
- [x] Privacidad (`/privacy`) y Términos (`/terms`), en los dos idiomas.
- [x] Puente de palabras, el juego de Plus.
- [x] Tipografías dentro del proyecto (el build ya no depende de Google Fonts).
