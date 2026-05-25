import { ProjectView } from "../ProjectView.js";
import { ProjectNorthStarView } from "../query/north-star/ProjectNorthStarView.js";

export interface ShowProjectResponse {
  readonly project: ProjectView | null;
  readonly northStar: ProjectNorthStarView | null;
}
