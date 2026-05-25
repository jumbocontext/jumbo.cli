export interface TuiRequestController<TRequest, TResponse> {
  handle(request: TRequest): Promise<TResponse>;
}

export type TuiActionResult<TResponse> =
  | {
      readonly ok: true;
      readonly response: TResponse;
    }
  | {
      readonly ok: false;
      readonly error: Error;
    };

export async function dispatchTuiAction<TRequest, TResponse>(
  controller: TuiRequestController<TRequest, TResponse>,
  request: TRequest,
): Promise<TuiActionResult<TResponse>> {
  try {
    return {
      ok: true,
      response: await controller.handle(request),
    };
  } catch (caughtError) {
    return {
      ok: false,
      error: toError(caughtError),
    };
  }
}

function toError(caughtError: unknown): Error {
  if (caughtError instanceof Error) {
    return caughtError;
  }

  return new Error(String(caughtError));
}
