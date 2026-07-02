export interface RequestController<TRequest, TResponse> {
  handle(request: TRequest): Promise<TResponse>;
}
