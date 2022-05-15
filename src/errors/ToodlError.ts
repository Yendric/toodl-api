export class ToodlError extends Error {
  error: string;

  constructor(message: string, name: string) {
    super(message);
    this.name = name;
    this.error = message;
  }
}
