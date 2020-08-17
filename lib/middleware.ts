import cookieSession from "cookie-session";

export const session = cookieSession({
  secret: process.env.SESSION_SECRET,
});
