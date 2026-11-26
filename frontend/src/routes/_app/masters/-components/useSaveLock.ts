import { useRef, useState } from "react";

/** Holds the table locked from the start of a save until the list has refreshed. */
export function useSaveLock() {
  const held = useRef(false);
  const [locked, setLocked] = useState(false);

  async function runLocked(action: () => Promise<void>) {
    if (held.current) return;
    held.current = true;
    setLocked(true);
    try {
      await action();
    } finally {
      held.current = false;
      setLocked(false);
    }
  }

  return { locked, runLocked };
}
