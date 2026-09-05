/**
 * Geometria del hexagono del panal, para dibujarlo dentro de un SVG.
 *
 * Es la misma figura que el `clip-path` de `.hexagon-card`: pointy-top, con
 * vertice arriba y abajo y los dos lados verticales, asi que las fichas se
 * tocan de canto dentro de una fila y las filas se solapan a tres cuartos de
 * altura, desplazadas media ficha. Los dos iconos que enseñan un panal —el
 * boton de ajustes y la pestaña Home— comparten esta funcion para que dibujen
 * el mismo hexagono y no dos parecidos.
 *
 * `radius` es del centro al vertice: la ficha mide `2 * radius` de alto y
 * `√3 * radius` de ancho.
 */
export const HEXAGON_WIDTH_RATIO = Math.sqrt(3);

export function hexagonPoints(cx: number, cy: number, radius: number) {
  const half = (radius * HEXAGON_WIDTH_RATIO) / 2;

  return [
    [cx, cy - radius],
    [cx + half, cy - radius / 2],
    [cx + half, cy + radius / 2],
    [cx, cy + radius],
    [cx - half, cy + radius / 2],
    [cx - half, cy - radius / 2],
  ]
    .map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");
}
