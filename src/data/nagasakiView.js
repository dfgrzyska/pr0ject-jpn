// Shared geography for the painted panorama and moving traffic.
export const farShore = x => 241 - x * .285 + 8 * Math.sin(x * .033);
export const nearShore = x => 322 - x * .50 + 9 * Math.sin(x * .036);
export const hillRoad = x => 367 - x * .14 + 15 * Math.sin(x * .044);
// The ropeway seen from its top: from Fuchi's lower station up to us, passing under the summit's trees.
export const ropeway = { x0: 50, y0: 322, x1: 152, y1: 402, gap: 1.8 };
