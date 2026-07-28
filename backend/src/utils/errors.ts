// error-handler reads statusCode off the thrown error, so services can signal an
// expected 4xx without knowing anything about the response layer
export class ConflictError extends Error {
  statusCode = 409;

  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}
