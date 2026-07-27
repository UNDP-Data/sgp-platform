export type ScaleTranslateMatrix = {
  scale: number;
  translate: [number, number];
};

export function parseScaleTranslateMatrix(transform: string | null): ScaleTranslateMatrix | null {
  if (!transform) return null;
  const match = /^matrix\((.*)\)$/i.exec(transform.trim());
  if (!match) return null;
  const values = match[1].trim().split(/[\s,]+/).map(Number);
  if (values.length !== 6 || values.some((value) => !Number.isFinite(value))) return null;

  const [scaleX, skewY, skewX, scaleY, translateX, translateY] = values;
  const tolerance = 1e-6;
  if (
    scaleX <= 0
    || scaleY <= 0
    || Math.abs(skewX) > tolerance
    || Math.abs(skewY) > tolerance
    || Math.abs(scaleX - scaleY) > tolerance
  ) return null;

  return {
    scale: Math.max(.0001, (scaleX + scaleY) / 2),
    translate: [translateX, translateY]
  };
}
