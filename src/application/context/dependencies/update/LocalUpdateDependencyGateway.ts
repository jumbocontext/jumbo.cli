import { IUpdateDependencyGateway } from "./IUpdateDependencyGateway.js";
import { UpdateDependencyRequest } from "./UpdateDependencyRequest.js";
import { UpdateDependencyResponse } from "./UpdateDependencyResponse.js";
import { UpdateDependencyCommandHandler } from "./UpdateDependencyCommandHandler.js";
import { IDependencyUpdateReader } from "./IDependencyUpdateReader.js";

export class LocalUpdateDependencyGateway implements IUpdateDependencyGateway {
  constructor(
    private readonly commandHandler: UpdateDependencyCommandHandler,
    private readonly dependencyReader: IDependencyUpdateReader
  ) {}

  async updateDependency(request: UpdateDependencyRequest): Promise<UpdateDependencyResponse> {
    const result = await this.commandHandler.execute({
      id: request.dependencyId,
      endpoint: request.endpoint,
      contract: request.contract,
      status: request.status,
    });

    const view = await this.dependencyReader.findById(result.dependencyId);

    const response: UpdateDependencyResponse = {
      dependencyId: result.dependencyId,
    };

    if (view) {
      return {
        ...response,
        consumerId: view.consumerId,
        providerId: view.providerId,
        endpoint: view.endpoint,
        contract: view.contract,
        status: view.status,
      };
    }

    return response;
  }
}
