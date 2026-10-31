import { useEffect, useState } from "react";

/**
 * Track whether the primary pointer is coarse (typical phones / touch).
 * Returns false until the media query is read after the initial render.
 */
export function useCoarsePointer(): boolean {
  const [coarse, setCoarse] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(pointer: coarse)");
    const update = () => setCoarse(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return coarse;
}
