type Timed = { durationSec: number };

export function shuffled<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Minutes credited for watching a video (rounded, at least 1).
export const videoMinutes = (v: Timed) =>
  Math.max(1, Math.round(v.durationSec / 60));

// Pick videos from an (already shuffled) pool until their total length reaches
// the target. Videos that would overshoot by more than `toleranceSec` are
// skipped at first; if the target still isn't met, the shortest video that
// covers the rest (or else the longest left) is added until it is.
export function buildPlaylist<T extends Timed>(
  pool: T[],
  targetMin: number,
  toleranceSec = 5 * 60,
): T[] {
  const target = targetMin * 60;
  const picked: T[] = [];
  let total = 0;

  for (const v of pool) {
    if (total >= target) break;
    if (v.durationSec <= target - total + toleranceSec) {
      picked.push(v);
      total += v.durationSec;
    }
  }

  const rest = pool
    .filter((v) => !picked.includes(v))
    .sort((a, b) => a.durationSec - b.durationSec);
  while (total < target && rest.length > 0) {
    const need = target - total;
    const i = rest.findIndex((v) => v.durationSec >= need);
    const [v] = rest.splice(i === -1 ? rest.length - 1 : i, 1);
    picked.push(v);
    total += v.durationSec;
  }

  return picked;
}
