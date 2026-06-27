import { useEffect, useState } from "react";

/**
 * Matches the mobile breakpoint (`max-width: 768px`) used across the app.
 * SSR-safe (no window on first render) and re-evaluates on resize.
 */
export function useIsMobile(breakpoint = 768): boolean {
  const [mobile, setMobile] = useState(() =>
    typeof window === "undefined" ? false : window.innerWidth <= breakpoint,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setMobile(window.innerWidth <= breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);

  return mobile;
}
