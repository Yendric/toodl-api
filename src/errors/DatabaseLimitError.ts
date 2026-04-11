import { ToodlError } from "#/errors/ToodlError.js";

export class DatabaseLimitError extends ToodlError {
  constructor(message: string) {
    super(message, "DatabaseLimitError");
  }
}
