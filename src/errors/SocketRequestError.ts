import { ToodlError } from "#/errors/ToodlError.js";

export class SocketRequestError extends ToodlError {
  constructor(message: string) {
    super(message, "SocketRequestError");
  }
}
