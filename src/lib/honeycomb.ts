import { HEXAGON_WIDTH_RATIO } from "./hexagon";

/**
 * El panal, calculado.
 *
 * Antes cada ficha se colocaba a mano en `globals.css` con
 * `.hexagon-card:nth-child(N) { left: …; top: … }`, en dos juegos de reglas,
 * y el `aspect-ratio` de la rejilla se recalculaba a ojo cada vez. Funcionaba
 * mientras el número de hexágonos no cambiara: añadir el décimo ya obligó a
 * buscarle el hueco, y el undécimo habría obligado a rehacer los dos
 * `aspect-ratio`. Aquí la posición sale del índice y del número de columnas,
 * así que un hexágono nuevo no necesita tocar una sola línea de CSS.
 *
 * La figura es pointy-top: vértice arriba y abajo, lados verticales. De ahí
 * salen las tres constantes de las que depende todo lo demás, y no hay más
 * geometría que esta en ningún otro sitio.
 */

/** Ancho entre lados ÷ alto entre vértices: √3/2. */
export const CELL_ASPECT = HEXAGON_WIDTH_RATIO / 2;

/**
 * Cuánto baja cada fila respecto a la anterior, en alturas de ficha.
 *
 * Tres cuartos, no uno: las filas se engranan. Es lo que hace que el conjunto
 * sea un panal y no una cuadrícula de hexágonos sueltos.
 */
export const ROW_STEP = 0.75;

/** Las filas impares van corridas media ficha, que es lo que las engrana. */
export const ODD_ROW_OFFSET = 0.5;

export type HoneycombCell = {
  /** Posición del borde izquierdo, en % del ancho de la rejilla. */
  left: number;
  /** Posición del borde superior, en % del alto de la rejilla. */
  top: number;
};

export type HoneycombLayout = {
  columns: number;
  rows: number;
  /** Ancho de una ficha, en % del ancho de la rejilla. */
  cellWidth: number;
  /** Ancho ÷ alto de la rejilla entera, para reservarle sitio sin saltos. */
  aspectRatio: number;
  cells: HoneycombCell[];
};

/**
 * Dónde cae cada ficha de un panal de `count` hexágonos en `columns` columnas.
 *
 * La rejilla mide `columns + 0.5` fichas de ancho: la media de más es el
 * saliente de las filas corridas, y sin reservarla la última ficha de esas
 * filas se saldría por la derecha.
 */
export function honeycombLayout(
  count: number,
  columns: number,
): HoneycombLayout {
  const safeColumns = Math.max(1, Math.round(columns));
  const rows = Math.max(1, Math.ceil(count / safeColumns));

  // En fracciones de rejilla primero, y a porcentaje al final.
  const cellWidth = 1 / (safeColumns + ODD_ROW_OFFSET);
  const cellHeight = cellWidth / CELL_ASPECT;
  const gridHeight = cellHeight * (1 + ROW_STEP * (rows - 1));

  const cells: HoneycombCell[] = Array.from({ length: count }, (_, index) => {
    const row = Math.floor(index / safeColumns);
    const column = index % safeColumns;
    const indent = row % 2 === 1 ? ODD_ROW_OFFSET : 0;

    return {
      left: (column + indent) * cellWidth * 100,
      top: ((row * ROW_STEP * cellHeight) / gridHeight) * 100,
    };
  });

  return {
    columns: safeColumns,
    rows,
    cellWidth: cellWidth * 100,
    // Alto y ancho de la rejilla están en la misma unidad, así que el
    // cociente es directamente la proporción que hay que reservar.
    aspectRatio: 1 / gridHeight,
    cells,
  };
}

/**
 * Cuántas columnas usa cada tamaño de pantalla.
 *
 * No es el mismo panal encogido: con diez hexágonos son cinco filas de dos en
 * un teléfono, cuatro de tres en una tableta y tres de cuatro en un
 * escritorio. La composición se reorganiza, que es lo que pedía el encargo.
 */
export const HONEYCOMB_BREAKPOINTS = [
  { key: "sm", columns: 2, minWidth: 0 },
  { key: "md", columns: 3, minWidth: 640 },
  { key: "lg", columns: 4, minWidth: 1024 },
] as const;

export type HoneycombBreakpoint = (typeof HONEYCOMB_BREAKPOINTS)[number]["key"];
