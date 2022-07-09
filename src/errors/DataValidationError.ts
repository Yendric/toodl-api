import { ToodlError } from "@/errors/ToodlError";

export class DataValidationError extends ToodlError {
  constructor(message: string) {
    super(message, "DataValidationError");
  }
}
