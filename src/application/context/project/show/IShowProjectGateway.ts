import { ShowProjectRequest } from "./ShowProjectRequest.js";
import { ShowProjectResponse } from "./ShowProjectResponse.js";

export interface IShowProjectGateway {
  showProject(request: ShowProjectRequest): Promise<ShowProjectResponse>;
}
