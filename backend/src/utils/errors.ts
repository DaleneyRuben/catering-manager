// error-handler reads statusCode off the thrown error, so services can signal an
// expected 4xx without knowing anything about the response layer
// A factory rather than a second class: one class per file is enforced, and all this needs to be
// is an Error carrying the status the handler should answer with.
export const badRequestError = (message: string): Error =>
  Object.assign(new Error(message), { statusCode: 400, name: 'BadRequestError' });

export class ConflictError extends Error {
  statusCode = 409;

  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}
