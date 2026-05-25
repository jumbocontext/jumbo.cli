import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { GetGoalsController } from "../../../application/context/goals/get/GetGoalsController.js";
import type { GetGoalsRequest } from "../../../application/context/goals/get/GetGoalsRequest.js";
import type { GetGoalsResponse } from "../../../application/context/goals/get/GetGoalsResponse.js";
import type { GoalStatusType } from "../../../domain/goals/Constants.js";
import type { GetProjectSummaryQueryHandler } from "../../../application/context/project/query/GetProjectSummaryQueryHandler.js";
import type { ProjectSummaryView } from "../../../application/context/project/ProjectSummaryView.js";
import type { GetSessionsController } from "../../../application/context/sessions/get/GetSessionsController.js";
import type { GetSessionsResponse } from "../../../application/context/sessions/get/GetSessionsResponse.js";
import type { SessionStatusFilter } from "../../../application/context/sessions/get/ISessionViewReader.js";
import type { GetComponentsController } from "../../../application/context/components/list/GetComponentsController.js";
import type { GetComponentsResponse } from "../../../application/context/components/list/GetComponentsResponse.js";
import type { ComponentStatusFilter } from "../../../application/context/components/get/IComponentViewReader.js";
import type { GetDecisionsController } from "../../../application/context/decisions/get/GetDecisionsController.js";
import type { GetDecisionsResponse } from "../../../application/context/decisions/get/GetDecisionsResponse.js";
import type { DecisionStatusFilter } from "../../../application/context/decisions/get/IDecisionViewReader.js";
import type { GetDependenciesController } from "../../../application/context/dependencies/get/GetDependenciesController.js";
import type { GetDependenciesResponse } from "../../../application/context/dependencies/get/GetDependenciesResponse.js";
import type { DependencyListFilter } from "../../../application/context/dependencies/get/IDependencyViewReader.js";
import type { GetGuidelinesController } from "../../../application/context/guidelines/get/GetGuidelinesController.js";
import type { GetGuidelinesResponse } from "../../../application/context/guidelines/get/GetGuidelinesResponse.js";
import type { GetInvariantsController } from "../../../application/context/invariants/get/GetInvariantsController.js";
import type { GetAllInvariantsResponse } from "../../../application/context/invariants/get/GetAllInvariantsResponse.js";

export const DEFAULT_TUI_STATE_READER_TICK_MS = 2000;

export interface TuiStateReaderControllers {
  readonly getProjectSummaryQueryHandler?: Pick<
    GetProjectSummaryQueryHandler,
    "execute"
  >;
  readonly getGoalsController?: Pick<GetGoalsController, "handle">;
  readonly getSessionsController?: Pick<GetSessionsController, "handle">;
  readonly getComponentsController?: Pick<GetComponentsController, "handle">;
  readonly getDecisionsController?: Pick<GetDecisionsController, "handle">;
  readonly getDependenciesController?: Pick<
    GetDependenciesController,
    "handle"
  >;
  readonly getGuidelinesController?: Pick<GetGuidelinesController, "handle">;
  readonly getInvariantsController?: Pick<
    GetInvariantsController,
    "getAllInvariants"
  >;
}

export interface TuiStateReaderOptions {
  readonly tickMs?: number;
}

export interface TuiStateSnapshot<TData> {
  readonly data: TData | null;
  readonly error: Error | null;
  readonly loading: boolean;
  readonly refresh: () => Promise<void>;
}

interface TuiStateReaderContextValue {
  readonly controllers: TuiStateReaderControllers;
  readonly tickMs: number;
}

interface TuiStateReaderProviderProps {
  readonly controllers?: TuiStateReaderControllers;
  readonly options?: TuiStateReaderOptions;
  readonly children: React.ReactNode;
}

const TuiStateReaderContext =
  createContext<TuiStateReaderContextValue | null>(null);

export function TuiStateReaderProvider({
  controllers = {},
  options = {},
  children,
}: TuiStateReaderProviderProps): React.ReactElement {
  const tickMs = options.tickMs ?? DEFAULT_TUI_STATE_READER_TICK_MS;
  const value = useMemo(
    () => ({
      controllers,
      tickMs,
    }),
    [controllers, tickMs],
  );

  return (
    <TuiStateReaderContext.Provider value={value}>
      {children}
    </TuiStateReaderContext.Provider>
  );
}

export function useProjectContext(): TuiStateSnapshot<ProjectSummaryView> {
  const context = useContext(TuiStateReaderContext);
  const controller = context?.controllers.getProjectSummaryQueryHandler;

  return useTickingReadModel<ProjectSummaryView>(
    useCallback(async () => {
      if (controller === undefined) {
        return null;
      }

      return controller.execute();
    }, [controller]),
    controller === undefined
      ? 0
      : context?.tickMs ?? DEFAULT_TUI_STATE_READER_TICK_MS,
  );
}

export function useGoalsList(
  statusFilter?: GoalStatusType,
): TuiStateSnapshot<GetGoalsResponse> {
  const context = useContext(TuiStateReaderContext);
  const controller = context?.controllers.getGoalsController;

  return useTickingReadModel<GetGoalsResponse>(
    useCallback(async () => {
      if (controller === undefined) {
        return null;
      }

      const request: GetGoalsRequest =
        statusFilter === undefined ? {} : { statuses: [statusFilter] };
      return controller.handle(request);
    }, [controller, statusFilter]),
    controller === undefined
      ? 0
      : context?.tickMs ?? DEFAULT_TUI_STATE_READER_TICK_MS,
  );
}

export function useSessionsList(
  status: SessionStatusFilter = "all",
): TuiStateSnapshot<GetSessionsResponse> {
  const context = useContext(TuiStateReaderContext);
  const controller = context?.controllers.getSessionsController;

  return useTickingReadModel<GetSessionsResponse>(
    useCallback(async () => {
      if (controller === undefined) {
        return null;
      }

      return controller.handle({ status });
    }, [controller, status]),
    controller === undefined
      ? 0
      : context?.tickMs ?? DEFAULT_TUI_STATE_READER_TICK_MS,
  );
}

export function useComponentsList(
  status: ComponentStatusFilter = "active",
): TuiStateSnapshot<GetComponentsResponse> {
  const context = useContext(TuiStateReaderContext);
  const controller = context?.controllers.getComponentsController;

  return useTickingReadModel<GetComponentsResponse>(
    useCallback(async () => {
      if (controller === undefined) {
        return null;
      }

      return controller.handle({ status });
    }, [controller, status]),
    controller === undefined
      ? 0
      : context?.tickMs ?? DEFAULT_TUI_STATE_READER_TICK_MS,
  );
}

export function useDecisionsList(
  status: DecisionStatusFilter = "active",
): TuiStateSnapshot<GetDecisionsResponse> {
  const context = useContext(TuiStateReaderContext);
  const controller = context?.controllers.getDecisionsController;

  return useTickingReadModel<GetDecisionsResponse>(
    useCallback(async () => {
      if (controller === undefined) {
        return null;
      }

      return controller.handle({ status });
    }, [controller, status]),
    controller === undefined
      ? 0
      : context?.tickMs ?? DEFAULT_TUI_STATE_READER_TICK_MS,
  );
}

export function useDependenciesList(
  filter?: DependencyListFilter,
): TuiStateSnapshot<GetDependenciesResponse> {
  const context = useContext(TuiStateReaderContext);
  const controller = context?.controllers.getDependenciesController;

  return useTickingReadModel<GetDependenciesResponse>(
    useCallback(async () => {
      if (controller === undefined) {
        return null;
      }

      return controller.handle(filter === undefined ? {} : { filter });
    }, [controller, filter]),
    controller === undefined
      ? 0
      : context?.tickMs ?? DEFAULT_TUI_STATE_READER_TICK_MS,
  );
}

export function useGuidelinesList(
  category?: string,
): TuiStateSnapshot<GetGuidelinesResponse> {
  const context = useContext(TuiStateReaderContext);
  const controller = context?.controllers.getGuidelinesController;

  return useTickingReadModel<GetGuidelinesResponse>(
    useCallback(async () => {
      if (controller === undefined) {
        return null;
      }

      return controller.handle(category === undefined ? {} : { category });
    }, [category, controller]),
    controller === undefined
      ? 0
      : context?.tickMs ?? DEFAULT_TUI_STATE_READER_TICK_MS,
  );
}

export function useInvariantsList(): TuiStateSnapshot<GetAllInvariantsResponse> {
  const context = useContext(TuiStateReaderContext);
  const controller = context?.controllers.getInvariantsController;

  return useTickingReadModel<GetAllInvariantsResponse>(
    useCallback(async () => {
      if (controller === undefined) {
        return null;
      }

      return controller.getAllInvariants({});
    }, [controller]),
    controller === undefined
      ? 0
      : context?.tickMs ?? DEFAULT_TUI_STATE_READER_TICK_MS,
  );
}

function useTickingReadModel<TData>(
  read: () => Promise<TData | null>,
  tickMs: number,
): TuiStateSnapshot<TData> {
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
