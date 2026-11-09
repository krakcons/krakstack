import { useState } from "react";

// DataTable clamps an out-of-range page. Keep the last authoritative total
// while a new query instance loads so page changes cannot snap back to zero.
export const useTableTotal = (total: number | undefined) => {
  const [previous, setPrevious] = useState(total ?? 0);
  if (total !== undefined && total !== previous) setPrevious(total);
  return total ?? previous;
};
