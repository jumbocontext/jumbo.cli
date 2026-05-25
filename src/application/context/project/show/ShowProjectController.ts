import { IShowProjectGateway } from "./IShowProjectGateway.js";
import { ShowProjectRequest } from "./ShowProjectRequest.js";
import { ShowProjectResponse } from "./ShowProjectResponse.js";

export class ShowProjectController {
  constructor(private readonly gateway: IShowProjectGateway) {}

  async handle(request: ShowProjectRequest): Promise<ShowProjectResponse> {
    return this.gateway.showProject(request);
  }
}
