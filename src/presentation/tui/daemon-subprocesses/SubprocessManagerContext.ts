import { createContext } from "react";
import type { ISubprocessManager } from "./ISubprocessManager.js";
import { NoOpSubprocessManager } from "./NoOpSubprocessManager.js";

export const SubprocessManagerContext = createContext<ISubprocessManager>(
  new NoOpSubprocessManager(),
);
