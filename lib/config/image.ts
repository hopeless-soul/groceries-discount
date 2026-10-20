export const croppedImageConfig = {
  /** Fraction of the page added around each boundaryBox edge, clamped to 0..1. */
  boundaryPadding: 0.1,
  /** Clamp the padded box to 0..1. Off: edge crops can show blank strips past the page. */
  clampValues: false as boolean,
} as const;
