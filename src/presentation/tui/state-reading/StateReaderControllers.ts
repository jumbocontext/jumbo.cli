import type { GetComponentsController } from "../../../application/context/components/list/GetComponentsController.js";
import type { GetDecisionsController } from "../../../application/context/decisions/get/GetDecisionsController.js";
import type { GetDependenciesController } from "../../../application/context/dependencies/get/GetDependenciesController.js";
import type { GetGoalsController } from "../../../application/context/goals/get/GetGoalsController.js";
import type { ShowGoalController } from "../../../application/context/goals/get/ShowGoalController.js";
import type { GetGuidelinesController } from "../../../application/context/guidelines/get/GetGuidelinesController.js";
import type { GetInvariantsController } from "../../../application/context/invariants/get/GetInvariantsController.js";
import type { ProjectStatsController } from "../../../application/context/project/stats/ProjectStatsController.js";
import type { GetProjectSummaryQueryHandler } from "../../../application/context/project/query/GetProjectSummaryQueryHandler.js";
import type { GetSessionsController } from "../../../application/context/sessions/get/GetSessionsController.js";
import type { SearchController } from "../../../application/context/search/SearchController.js";

export interface StateReaderControllers {
  readonly getProjectSummaryQueryHandler?: Pick<
    GetProjectSummaryQueryHandler,
    "execute"
  >;
  readonly getGoalsController?: Pick<GetGoalsController, "handle">;
  readonly showGoalController?: Pick<ShowGoalController, "handle">;
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
  readonly projectStatsController?: Pick<ProjectStatsController, "handle">;
  readonly searchController?: Pick<SearchController, "handle">;
}
