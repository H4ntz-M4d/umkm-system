import { useEffect, useRef } from "react";

/**
 * Global keyboard listener that detects USB HID barcode scanners.
 *
 * Heuristic: scanners type characters in rapid succession (typically <30ms apart)
 * and end with Enter. A human typing in the search box rarely exceeds ~20 char/sec.
 *
 * When a scan is detected, `onScan(code)` fires. We also preventDefault so the
 * code does NOT leak into a focused <input> (e.g. the search bar).
 */
export function useBarcodeScanner(
  onScan: (code: string) => void,
  options: { minLength?: number; maxKeyIntervalMs?: number; enabled?: boolean } = {},
) {
  const { minLength = 4, maxKeyIntervalMs = 35, enabled = true } = options;
  const bufferRef = useRef<string>("");
  const lastTimeRef = useRef<number>(0);
  const onScanRef = useRef(onScan);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      const now = performance.now();
      const delta = now - lastTimeRef.current;
      lastTimeRef.current = now;

      // Reset buffer if too slow (human typing)
      if (delta > maxKeyIntervalMs && bufferRef.current.length > 0) {
        bufferRef.current = "";
      }

      if (e.key === "Enter") {
        const code = bufferRef.current;
        bufferRef.current = "";
        if (code.length >= minLength) {
          e.preventDefault();
          e.stopPropagation();
          onScanRef.current(code);
        }
        return;
      }

      // Only capture printable single chars
      if (e.key.length === 1) {
        bufferRef.current += e.key;
        // If burst is fast, suppress propagation into focused inputs
        if (delta < maxKeyIntervalMs && bufferRef.current.length > 1) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [enabled, minLength, maxKeyIntervalMs]);
}
