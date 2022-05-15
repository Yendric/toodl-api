import { ToodlError } from "./ToodlError";

export class DatabaseLimitError extends ToodlError {
  constructor(message: string) {
    super(message, "DatabaseLimitError");
  }
}
