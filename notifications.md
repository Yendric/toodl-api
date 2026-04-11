# Plan: Browser Notification Support (Web Push Protocol)

This plan outlines the steps to add browser notification support to the Toodl API using the Web Push Protocol, VAPID, and the `web-push` library.

## 1. Database Schema Updates

- **File:** `prisma/schema.prisma`
- **Changes:**
  - Add `PushSubscription` model to store browser-specific subscription data.
  - Add push-specific notification preference flags to the `User` model: `dailyPush`, `reminderPush`, `nowPush`.
  - Establish a one-to-many relationship between `User` and `PushSubscription`.

## 2. Dependencies

- Install `web-push` for handling the Web Push Protocol.
- Install `@types/web-push` for TypeScript support.

## 3. Environment Configuration

- **File:** `.env.example` and `.env`
- **Additions:**
  - `VAPID_PUBLIC_KEY`: The public key for VAPID.
  - `VAPID_PRIVATE_KEY`: The private key for VAPID.
  - `VAPID_SUBJECT`: Contact information for the push service (e.g., `mailto:support@toodl.com`).

## 4. Service Layer Implementation

- **File:** `src/services/NotificationService.ts`
- **Features:**
  - Configure `web-push` with VAPID keys.
  - `subscribe(userId, subscription)`: Save or update a push subscription for a user.
  - `unsubscribe(endpoint)`: Remove a push subscription by endpoint.
  - `sendPush(userId, payload, type)`: Send a push notification to all subscriptions for a specific user.
  - Support both **visible alerts** (title, body, deep link) and **silent push notifications** (data-only).
  - Automatically prune invalid/expired subscriptions (404/410 errors).

## 5. Controller Layer Implementation

- **File:** `src/controllers/notification.ts`
- **Endpoints:**
  - `GET /v1/notifications/vapid-public-key`: Returns the public VAPID key to the frontend.
  - `POST /v1/notifications/subscribe`: Saves a new browser subscription for the authenticated user.
  - `POST /v1/notifications/unsubscribe`: Removes a subscription.

## 6. Update User Preferences

- **Files:** `src/controllers/user.ts`, `src/services/UserService.ts`
- **Changes:**
  - Include `dailyPush`, `reminderPush`, and `nowPush` in the user data returned by `GET /v1/auth/user_data`.
  - Allow users to update these flags via `POST /v1/auth/user_data`.

## 7. Integration with Cron Jobs

- **File:** `src/cronjobs/index.ts`
- **Changes:**
  - Update the daily summary cron job (18:00) to trigger push notifications.
  - Update the minute-by-minute reminder cron job to trigger push notifications for "now" and "15-minute" reminders.
  - Include **deep links** (e.g., using `APP_URI`) to specific todos or lists in the notification payload.

## 8. Verification & Testing

- Create a new test file `test/services/NotificationService.test.ts`.
- Add integration tests for the notification endpoints.
- Verify that push notifications are only sent when the user's push preferences are enabled.
