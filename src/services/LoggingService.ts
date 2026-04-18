import { injectable } from "inversify";
import colors from "@colors/colors";

export interface ILoggingService {
  log(message: string): void;
  announce(message: string): void;
  success(message: string): void;
  error(message: string): void;
}

@injectable()
export class LoggingService implements ILoggingService {
  public log(message: string): void {
    console.info(colors.dim(`[${new Date().toLocaleTimeString(undefined, { hour12: false })}] `) + colors.white(message));
  }

  public announce(message: string): void {
    this.log(colors.bgGreen(message));
  }

  public success(message: string): void {
    this.log(colors.green(message));
  }

  public error(message: string): void {
    this.log(colors.red(message));
  }
}
