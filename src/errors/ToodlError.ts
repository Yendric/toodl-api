export class ToodlError extends Error {
  public readonly status: number;

  constructor(message: string, name: string = "ToodlError", status: number = 422) {
    super(message);
    this.name = name;
    this.status = status;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
