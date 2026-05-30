import { useContext } from "react";
import type { ISubprocessManager } from "./ISubprocessManager.js";
import { SubprocessManagerContext } from "./SubprocessManagerContext.js";

export function useSubprocessManager(): ISubprocessManager {
  return useContext(SubprocessManagerContext);
}
