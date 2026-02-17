import { IGetSessionsGateway } from "../../../../application/context/sessions/get/IGetSessionsGateway.js";
import { GetSessionsRequest } from "../../../../application/context/sessions/get/GetSessionsRequest.js";
import { GetSessionsResponse } from "../../../../application/context/sessions/get/GetSessionsResponse.js";
import { ISessionViewReader } from "../../../../application/context/sessions/get/ISessionViewReader.js";

export class LocalGetSessionsGateway implements IGetSessionsGateway {
  constructor(
    private readonly sessionViewReader: ISessionViewReader
  ) {}

  async getSessions(request: GetSessionsRequest): Promise<GetSessionsResponse> {
    const sessions = await this.sessionViewReader.findAll(request.status);
    return { sessions };
  }
}
