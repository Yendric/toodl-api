import { ToodlError } from "./ToodlError";

export class SocketRequestError extends ToodlError {
  constructor(message: string) {
    super(message, "SocketRequestError");
  }
}
