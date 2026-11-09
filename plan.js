export const MB = 1024 * 1024;
export const AUDIO_BPS = 96000;

export function createPlan(meta, target, resolution = 'auto') {
  const targetMB = Number(target);
  if (!Number.isFinite(targetMB) || targetMB < 0.5) throw new Error('Elegí un tamaño de al menos 0,5 MB.');
  if (![meta?.w, meta?.h, meta?.dur].every(n => Number.isFinite(n) && n > 0)) throw new Error('No se pudo leer la duración o la resolución del video.');
  const budget = targetMB * MB * 8 * 0.9 / meta.dur - AUDIO_BPS;
  const vbps = Math.max(150000, budget);
  const shortSide = Math.min(meta.w, meta.h);
  const automatic = vbps >= 4.5e6 ? 1080 : vbps >= 2e6 ? 720 : vbps >= 900e3 ? 480 : 360;
  const wanted = resolution === 'orig' ? shortSide : resolution === 'auto' ? automatic : Number(resolution);
  if (!Number.isFinite(wanted) || wanted <= 0) throw new Error('Elegí una resolución válida.');
  const scale = Math.min(1, wanted / shortSide);
  const even = n => Math.max(2, Math.floor(n / 2) * 2);
  return { targetMB, vbps, tooSmall: budget < 150000, w: even(meta.w * scale), h: even(meta.h * scale) };
}

export const fractionTarget = (size, fraction) => Math.max(0.5, Math.round(size / MB * fraction * 10) / 10);
