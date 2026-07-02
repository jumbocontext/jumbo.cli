import React, { useMemo } from "react";
import type { StateReaderControllers } from "./StateReaderControllers.js";
import { StateReaderContext } from "./StateReaderContext.js";
import { DEFAULT_STATE_READER_TICK_MS } from "./StateReaderDefaults.js";
import type { StateReaderOptions } from "./StateReaderOptions.js";

interface StateReaderProviderProps {
  readonly controllers?: StateReaderControllers;
  readonly options?: StateReaderOptions;
  readonly children: React.ReactNode;
}

export function StateReaderProvider({
  controllers = {},
  options = {},
  children,
}: StateReaderProviderProps): React.ReactElement {
  const tickMs = options.tickMs ?? DEFAULT_STATE_READER_TICK_MS;
  const value = useMemo(
    () => ({
      controllers,
      tickMs,
    }),
    [controllers, tickMs],
  );

  return (
    <StateReaderContext.Provider value={value}>
      {children}
    </StateReaderContext.Provider>
  );
}
