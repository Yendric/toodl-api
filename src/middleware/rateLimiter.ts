import rateLimit from "express-rate-limit";

export const predictCategoryMinuteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  message: "Too many prediction requests from this IP in the last minute. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

export const predictCategoryDailyLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 1500,
  message: "Daily limit of 1500 prediction requests reached for this IP. Please try again tomorrow.",
  standardHeaders: true,
  legacyHeaders: false,
});
