import { IStartSessionGateway } from "./IStartSessionGateway.js";
import { SessionStartRequest } from "./SessionStartRequest.js";
import { SessionStartResponse } from "./SessionStartResponse.js";
import { StartSessionCommandHandler } from "./StartSessionCommandHandler.js";
import { IBrownfieldStatusReader } from "./IBrownfieldStatusReader.js";

export class LocalStartSessionGateway implements IStartSessionGateway {
  constructor(
    private readonly startSessionCommandHandler: StartSessionCommandHandler,
    private readonly brownfieldStatusReader: IBrownfieldStatusReader
  ) {}

  async startSession(_request: SessionStartRequest): Promise<SessionStartResponse> {
    const isUnprimed = await this.brownfieldStatusReader.isUnprimed();
    const result = await this.startSessionCommandHandler.execute({});

    return {
      sessionId: result.sessionId,
      status: "active",
      isUnprimedBrownfield: isUnprimed,
    };
  }
}
