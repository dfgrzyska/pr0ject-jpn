/**
 * Where a looping mover of the live background is at stage time t: its distance s along the route, its direction
 * (1 forwards, -1 back) and whether it's moving. 'wrap' runs round and round from s0 (a fraction of the route);
 * 'pp' goes to the end, waits `hold` seconds, comes back and waits again, starting s0 of the way along its run.
 * The game places the movers with it and the art generator plans the traffic with it (so no car drives through
 * another), which is why both use this one function. p: { mode, total, sp, s0, n, gap, hold }.
 */
export function pathAt(p, t) {
  if (p.mode !== 'pp') return { s: (((p.s0 * p.total + p.sp * t) % p.total) + p.total) % p.total, dir: 1, moving: true };
  const minS = (p.n - 1) * p.gap;
  const span = Math.max(1e-6, p.total - minS);
  const run = span / p.sp;
  const cycle = 2 * run + 2 * p.hold;
  let k = (((t + p.s0 * run) % cycle) + cycle) % cycle;
  if (k < run) return { s: minS + p.sp * k, dir: 1, moving: true };
  k -= run;
  if (k < p.hold) return { s: p.total, dir: -1, moving: false };
  k -= p.hold;
  if (k < run) return { s: p.total - p.sp * k, dir: -1, moving: true };
  return { s: minS, dir: 1, moving: false };
}
