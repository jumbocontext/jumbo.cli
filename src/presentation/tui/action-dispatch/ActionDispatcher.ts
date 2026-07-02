import type { ActionResult } from "./ActionResult.js";
import { ActionErrorNormalizer } from "./ActionErrorNormalizer.js";
import type { RequestController } from "./RequestController.js";

export const ActionDispatcher = {
  async dispatch<TRequest, TResponse>(
    controller: RequestController<TRequest, TResponse>,
    request: TRequest,
  ): Promise<ActionResult<TResponse>> {
    try {
      return {
        ok: true,
        response: await controller.handle(request),
      };
    } catch (caughtError) {
      return {
        ok: false,
        error: ActionErrorNormalizer.normalize(caughtError),
      };
    }
  },
} as const;
