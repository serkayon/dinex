import { useEffect, useState } from "react";

const SYNC_INTERVAL_MS = 5 * 60 * 1000;

export default function useServerNow(apiBaseUrl, enabled = true) {
  const [serverOffsetMs, setServerOffsetMs] = useState(0);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!enabled || !apiBaseUrl) return undefined;

    let cancelled = false;

    const syncWithServer = async () => {
      const requestStartedAt = Date.now();
      try {
        const response = await fetch(`${apiBaseUrl}/shift-timings`, {
          cache: "no-store",
        });
        const dateHeader = response.headers.get("date");
        if (!dateHeader) return;

        const serverTimeMs = Date.parse(dateHeader);
        if (!Number.isFinite(serverTimeMs)) return;

        const responseReceivedAt = Date.now();
        const approxServerNow = serverTimeMs + (responseReceivedAt - requestStartedAt) / 2;
        if (!cancelled) {
          setServerOffsetMs(approxServerNow - responseReceivedAt);
        }
      } catch (_) {
      }
    };

    syncWithServer();
    const syncId = setInterval(syncWithServer, SYNC_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(syncId);
    };
  }, [apiBaseUrl, enabled]);

  useEffect(() => {
    if (!enabled) return undefined;
    const tick = () => setNow(Date.now() + serverOffsetMs);
    tick();
    const timerId = setInterval(tick, 1000);
    return () => clearInterval(timerId);
  }, [enabled, serverOffsetMs]);

  return now;
}
