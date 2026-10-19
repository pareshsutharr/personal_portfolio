"use client";

import * as React from "react";

export function useMediaQuery(query: string, initial = false) {
  const [matches, setMatches] = React.useState(initial);
  React.useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

export const useIsFinePointer = () => useMediaQuery("(hover: hover) and (pointer: fine)");
export const useIsDesktop = () => useMediaQuery("(min-width: 1024px)");
