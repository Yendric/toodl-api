import { injectable } from "inversify";
import { AuthService } from "#/services/AuthService.js";
import { LoggingService } from "#/services/LoggingService.js";
import { type Request as ExRequest } from "express";
import { Body, Controller, Get, Post, Request, Res, Route, Tags, type TsoaResponse } from "tsoa";

interface LoginRequest {
  /**
   * @minLength 3
   * @maxLength 50
   * @format email
   */
  email: string;
  /**
   * @minLength 8
   * @maxLength 50
   */
  password: string;
}

interface RegisterRequest {
  /**
   * @minLength 1
   * @maxLength 50
   */
  username: string;
  /**
   * @minLength 3
   * @maxLength 50
   * @format email
   */
  email: string;
  /**
   * @minLength 8
   * @maxLength 50
   */
  password: string;
}

interface GoogleLoginRequest {
  token: string;
}

interface AuthResponse {
  message: string;
}

@Route("auth")
@Tags("Auth")
@injectable()
export class AuthController extends Controller {
  constructor(
    private authService: AuthService,
    private loggingService: LoggingService,
  ) {
    super();
  }

  @Post("login")
  public async login(@Request() request: ExRequest, @Body() body: LoginRequest): Promise<AuthResponse> {
    const user = await this.authService.login(body.email, body.password);
    request.session.loggedIn = true;
    request.session.userId = user.id;

    return { message: "Succesvol ingelogd." };
  }

  @Post("register")
  public async register(@Request() request: ExRequest, @Body() body: RegisterRequest): Promise<AuthResponse> {
    const user = await this.authService.register(body.username, body.email, body.password);
    request.session.loggedIn = true;
    request.session.userId = user.id;

    return { message: "Succesvol geregistreerd." };
  }

  @Get("logout")
  public async logout(
    @Request() request: ExRequest,
    @Res() successRes: TsoaResponse<200, AuthResponse>,
    @Res() errorRes: TsoaResponse<500, AuthResponse>,
  ): Promise<void> {
    return new Promise((resolve) => {
      request.session.destroy((err) => {
        if (err) {
          this.loggingService.error("Fout bij uitloggen: " + err);
          errorRes(500, { message: "Er ging iets fout bij het uitloggen." });
          return resolve();
        }
        this.setHeader("Set-Cookie", "toodl_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly");
        successRes(200, { message: "Succesvol uitgelogd." });
        resolve();
      });
    });
  }

  @Post("google")
  public async google(@Request() request: ExRequest, @Body() body: GoogleLoginRequest): Promise<AuthResponse> {
    const user = await this.authService.google(body.token);
    request.session.loggedIn = true;
    request.session.userId = user.id;

    return { message: "Google login/register succesvol." };
  }
}
