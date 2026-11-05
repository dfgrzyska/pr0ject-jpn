// Shared geography for the painted panorama and moving traffic.
export const farShore = x => 241 - x * .285 + 8 * Math.sin(x * .033);
export const nearShore = x => 322 - x * .50 + 9 * Math.sin(x * .036);
export const hillRoad = x => 367 - x * .14 + 15 * Math.sin(x * .044);
