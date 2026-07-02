import { useCallback, useEffect, useState } from "react";
import type { StateSnapshot } from "./StateSnapshot.js";

export function useTickingReadModel<TData>(
  read: () => Promise<TData | null>,
  tickMs: number,
): StateSnapshot<TData> {
  const [data, setData] = useState<TData | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const nextData = await read();
      setData(nextData);
      setError(null);
    } catch (caughtError) {
      setError(toError(caughtError));
    } finally {
      setLoading(false);
    }
  }, [read]);

  useEffect(() => {
    void refresh();

    if (tickMs <= 0) {
      return undefined;
    }

    const interval = setInterval(() => {
      void refresh();
    }, tickMs);

    return () => clearInterval(interval);
  }, [refresh, tickMs]);

  return {
    data,
    error,
    loading,
    refresh,
  };
}

function toError(caughtError: unknown): Error {
  if (caughtError instanceof Error) {
    return caughtError;
  }

  return new Error(String(caughtError));
}
