export type ActionResult<TResponse> =
  | {
      readonly ok: true;
      readonly response: TResponse;
    }
  | {
      readonly ok: false;
      readonly error: Error;
    };
