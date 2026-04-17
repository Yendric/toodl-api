import { type INotificationService } from "#/services/NotificationService.js";
import { getAuthenticatedUserId } from "#/utils/auth.js";
import { type Request as ExRequest } from "express";
import { Body, Controller, Get, Post, Request, Route, Security, Tags } from "tsoa";

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

@Route("notifications")
@Tags("Notification")
export class NotificationController extends Controller {
  constructor(private notificationService: INotificationService) {
    super();
  }

  @Get("vapid-public-key")
  public getVapidPublicKey(): { publicKey: string } {
    return { publicKey: process.env.VAPID_PUBLIC_KEY || "" };
  }

  @Security("session")
  @Post("subscribe")
  public async subscribe(@Request() request: ExRequest, @Body() body: PushSubscriptionData): Promise<void> {
    const userId = getAuthenticatedUserId(request);
    await this.notificationService.subscribe(userId, body);
  }

  @Security("session")
  @Post("unsubscribe")
  public async unsubscribe(@Body() body: { endpoint: string }): Promise<void> {
    await this.notificationService.unsubscribe(body.endpoint);
  }
}
