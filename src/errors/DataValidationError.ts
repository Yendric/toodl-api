import { ToodlError } from "#/errors/ToodlError.js";

export class DataValidationError extends ToodlError {
  constructor(message: string) {
    super(message, "DataValidationError");
  }
}
