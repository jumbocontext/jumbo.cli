import { IRemoveDependencyGateway } from "./IRemoveDependencyGateway.js";
import { RemoveDependencyRequest } from "./RemoveDependencyRequest.js";
import { RemoveDependencyResponse } from "./RemoveDependencyResponse.js";
import { RemoveDependencyCommandHandler } from "./RemoveDependencyCommandHandler.js";
import { IDependencyRemoveReader } from "./IDependencyRemoveReader.js";

export class LocalRemoveDependencyGateway implements IRemoveDependencyGateway {
  constructor(
    private readonly commandHandler: RemoveDependencyCommandHandler,
    private readonly reader: IDependencyRemoveReader
  ) {}

  async removeDependency(request: RemoveDependencyRequest): Promise<RemoveDependencyResponse> {
    const result = await this.commandHandler.execute({
      dependencyId: request.dependencyId,
      reason: request.reason,
    });

    const view = await this.reader.findById(result.dependencyId);

    return {
      dependencyId: result.dependencyId,
      consumer: view?.consumerId || "unknown",
      provider: view?.providerId || "unknown",
      status: view?.status || "removed",
      reason: request.reason,
    };
  }
}
