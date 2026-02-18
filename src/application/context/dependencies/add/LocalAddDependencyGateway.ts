import { IAddDependencyGateway } from "./IAddDependencyGateway.js";
import { AddDependencyRequest } from "./AddDependencyRequest.js";
import { AddDependencyResponse } from "./AddDependencyResponse.js";
import { AddDependencyCommandHandler } from "./AddDependencyCommandHandler.js";

export class LocalAddDependencyGateway implements IAddDependencyGateway {
  constructor(
    private readonly commandHandler: AddDependencyCommandHandler
  ) {}

  async addDependency(request: AddDependencyRequest): Promise<AddDependencyResponse> {
    const result = await this.commandHandler.execute({
      consumerId: request.consumerId,
      providerId: request.providerId,
      endpoint: request.endpoint,
      contract: request.contract,
    });

    return {
      dependencyId: result.dependencyId,
    };
  }
}
