import { useEffect, useRef, useState } from "react";
import { readBrowserLocation, scrollToLocation, type BrowserLocation } from "../lib/browser/navigation";

export function useBrowserLocation() {
  const [location, setLocation] = useState<BrowserLocation>(readBrowserLocation);
  const previousKey = useRef(location.key);

  useEffect(() => {
    const update = () => {
      const next = readBrowserLocation();
      setLocation(next);
      if (next.key !== previousKey.current) {
        requestAnimationFrame(() => scrollToLocation(next, next.hash ? "smooth" : "instant"));
      }
      previousKey.current = next.key;
    };
    window.addEventListener("popstate", update);
    return () => window.removeEventListener("popstate", update);
  }, []);

  return location;
}
