import { UpdateProjectRequest } from "./UpdateProjectRequest.js";
import { UpdateProjectResponse } from "./UpdateProjectResponse.js";

export interface IUpdateProjectGateway {
  updateProject(request: UpdateProjectRequest): Promise<UpdateProjectResponse>;
}
