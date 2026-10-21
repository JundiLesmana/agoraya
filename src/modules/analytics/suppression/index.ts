export const DEFAULT_MINIMUM_CELL_SIZE = 5;

export interface SuppressionOptions {
  readonly minimumCellSize?: number;
}

/** Return only cells large enough to meet the configured privacy threshold. */
export function suppressSmallCells<T>(
  cells: readonly T[],
  getCellSize: (cell: T) => number,
  options: SuppressionOptions = {},
): readonly T[] {
  const minimumCellSize = options.minimumCellSize ?? DEFAULT_MINIMUM_CELL_SIZE;
  if (!Number.isSafeInteger(minimumCellSize) || minimumCellSize < 2) {
    throw new RangeError(
      "Minimum cell size must be a safe integer of at least 2",
    );
  }

  return cells.filter((cell) => {
    const size = getCellSize(cell);
    if (!Number.isSafeInteger(size) || size < 0) {
      throw new RangeError("Cell size must be a non-negative safe integer");
    }
    return size >= minimumCellSize;
  });
}
