/**
 * The order of a journey, as indices into `stages`: the cities shuffled (by `shuffle`, which returns the list it
 * is given in a new order), then those marked "last" (Tokyo: always the end of the road). A city in the works
 * ("wip") is left out. `first` (the city picked in the menu, or asked for by the developer) goes to the front,
 * whatever it is marked.
 */
export function journeyOrder(stages, first, shuffle) {
  const open = stages.map((_, i) => i).filter((i) => !stages[i].wip);
  const order = [...shuffle(open.filter((i) => !stages[i].last)), ...open.filter((i) => stages[i].last)];
  if (first !== null && first !== undefined && stages[first]) {
    const at = order.indexOf(first);
    if (at >= 0) order.splice(at, 1);
    order.unshift(first);
  }
  return order;
}
