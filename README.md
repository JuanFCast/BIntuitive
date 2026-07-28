# 🐝 BeeSmart

Juego educativo táctil para niños de 4 a 8 años: escuchan o leen una instrucción corta y tocan la tarjeta correcta. Pensado para iPad primero, responsive para celular y web.

## Cómo correrlo

```bash
npm install
npm run dev      # desarrollo en http://localhost:3000
npm run build    # build de producción
npm start        # servir el build
```

Para probarlo en un iPad en la misma red WiFi: `npm run dev` y abrir `http://<IP-del-computador>:3000` en Safari.

## Qué incluye el MVP

- **3 mundos**: Lugares, Números y Colores (10 preguntas cada uno, en `src/data/questions.ts`).
- **Sesiones de 5 rondas** con 2 intentos por pregunta y pista en el segundo intento.
- **Dificultad suave**: sube tras 2 aciertos seguidos, baja si falla (2 → 3 → 4 opciones).
- **Voz** con Web Speech API (botón 🔊 para repetir; si el navegador no la soporta, solo se muestra el texto).
- **Feedback positivo**: "¡Muy bien!", "Casi... ¡intenta otra vez!", nunca regaños.
- **Mascota Bee** (abejita SVG) que celebra y da pistas.
- **Progreso local** en `localStorage`: estrellas totales, sesiones y nivel por categoría.
- **Salida protegida** para adultos (suma sencilla) y botón para silenciar sonidos.
- Sin login, sin anuncios, sin pagos, sin internet.

## Estructura

```
src/
  app/            # Pantallas: inicio, /categorias, /game
  components/     # Mascot, AnswerGrid, FeedbackOverlay, ResultsScreen...
  data/           # questions.ts (banco de preguntas), categories.ts
  lib/            # gameEngine, speech, storage, sounds
```

Para agregar preguntas solo hay que añadir objetos a `src/data/questions.ts` siguiendo el tipo `Question`. Los emojis son placeholders: cada opción acepta `imageSrc` para reemplazarlos por ilustraciones propias.
