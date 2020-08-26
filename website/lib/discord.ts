import simpleOauth2 from "simple-oauth2";

export const discordOauth = simpleOauth2.create({
  client: {
    id: process.env.DISCORD_CLIENT_ID as string,
    secret: process.env.DISCORD_CLIENT_SECRET as string,
  },
  auth: {
    tokenHost: "https://discordapp.com",
    tokenPath: "/api/oauth2/token",
    authorizePath: "/api/oauth2/authorize",
  },
});

export const authorizeConfig = {
  redirect_uri: process.env.DISCORD_REDIRECT_URL,
  scope: ["identify", "email", "guilds.join", "gdm.join"].join(" "),
};

export const authorizeURL = discordOauth.authorizationCode.authorizeURL(
  authorizeConfig
);
