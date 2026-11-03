/**
 * Where a looping mover of the live background is at stage time t: its distance s along the route, its direction
 * (1 forwards, -1 back) and whether it's moving. 'wrap' runs round and round from s0 (a fraction of the route);
 * 'pp' goes to the end, waits `hold` seconds, comes back and waits again, starting s0 of the way along its run.
 * The game places the movers with it and the art generator plans the traffic with it (so no car drives through
 * another), which is why both use this one function. p: { mode, total, sp, s0, n, gap, hold }. The answer is
 * written into out: the game passes the same object every frame, so nothing is left for the browser to sweep up.
 */
export function pathAt(p, t, out = {}) {
  out.dir = 1;
  out.moving = true;
  if (p.mode !== 'pp') {
    out.s = (((p.s0 * p.total + p.sp * t) % p.total) + p.total) % p.total;
    return out;
  }
  const minS = (p.n - 1) * p.gap;
  const span = Math.max(1e-6, p.total - minS);
  const run = span / p.sp;
  const cycle = 2 * run + 2 * p.hold;
  let k = (((t + p.s0 * run) % cycle) + cycle) % cycle;
  if (k < run) out.s = minS + p.sp * k;
  else if ((k -= run) < p.hold) {
    out.s = p.total;
    out.dir = -1;
    out.moving = false;
  } else if ((k -= p.hold) < run) {
    out.s = p.total - p.sp * k;
    out.dir = -1;
  } else {
    out.s = minS;
    out.moving = false;
  }
  return out;
}
