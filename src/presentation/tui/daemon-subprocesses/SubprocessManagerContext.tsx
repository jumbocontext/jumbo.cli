import React, { createContext, useContext } from "react";
import { ISubprocessManager } from "./ISubprocessManager.js";
import { NoOpSubprocessManager } from "./NoOpSubprocessManager.js";

const SubprocessManagerContext = createContext<ISubprocessManager>(new NoOpSubprocessManager());

export function SubprocessManagerProvider({
  manager,
  children,
}: {
  readonly manager: ISubprocessManager;
  readonly children: React.ReactNode;
}): React.ReactElement {
  return (
    <SubprocessManagerContext.Provider value={manager}>
      {children}
    </SubprocessManagerContext.Provider>
  );
}

export function useSubprocessManager(): ISubprocessManager {
  return useContext(SubprocessManagerContext);
}
