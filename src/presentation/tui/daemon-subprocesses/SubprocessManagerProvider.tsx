import React from "react";
import type { ISubprocessManager } from "./ISubprocessManager.js";
import { SubprocessManagerContext } from "./SubprocessManagerContext.js";

export interface SubprocessManagerProviderProps {
  readonly manager: ISubprocessManager;
  readonly children: React.ReactNode;
}

export function SubprocessManagerProvider({
  manager,
  children,
}: SubprocessManagerProviderProps): React.ReactElement {
  return (
    <SubprocessManagerContext.Provider value={manager}>
      {children}
    </SubprocessManagerContext.Provider>
  );
}
