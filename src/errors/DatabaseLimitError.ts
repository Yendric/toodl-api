import { ToodlError } from "@/errors/ToodlError";

export class DatabaseLimitError extends ToodlError {
  constructor(message: string) {
    super(message, "DatabaseLimitError");
  }
}
