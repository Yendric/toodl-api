import { ToodlError } from "@/errors/ToodlError";

export class SocketRequestError extends ToodlError {
  constructor(message: string) {
    super(message, "SocketRequestError");
  }
}
