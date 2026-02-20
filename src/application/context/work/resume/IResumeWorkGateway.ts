import { ResumeWorkRequest } from "./ResumeWorkRequest.js";
import { ResumeWorkResponse } from "./ResumeWorkResponse.js";

export interface IResumeWorkGateway {
  resumeWork(request: ResumeWorkRequest): Promise<ResumeWorkResponse>;
}
