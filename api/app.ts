import * as dateFns from "date-fns";

import { log, schema, server, settings, use } from "nexus";

import { PrismaClient } from "nexus-plugin-prisma/client";
import cookieSession from "cookie-session";
import cors from "cors";
import fetch from "cross-fetch";
import { prisma } from "nexus-plugin-prisma";
import simpleOauth2 from "simple-oauth2";

const db = new PrismaClient();

// Enables the Prisma plugin
use(prisma());

server.express.use(cors({ origin: true, credentials: true }));
server.express.set("trust proxy", 1);

server.express.use(
  cookieSession({
    secret: process.env.SESSION_SECRET,
  })
);

schema.addToContext<Express.Request>(async (req) => {
  return {
    playerId: req.session?.playerId as string,
  };
});

server.express.get("/discord/authorize", (req, res) => {
  res.redirect(discordAuthorizeURL);
});

server.express.get("/discord/callback", async (req, res, next) => {
  const { code } = req.query;
  const tokenConfig = {
    code: code as string,
    ...authorizeConfig,
  };

  log.debug("token config", tokenConfig);

  try {
    const result = await discordOauth.authorizationCode.getToken(tokenConfig);
    const accessToken = discordOauth.accessToken.create(result);

    const { id, username, discriminator } = await fetch(
      "https://discordapp.com/api/users/@me",
      {
        headers: {
          authorization: `${accessToken.token.token_type} ${accessToken.token.access_token}`,
        },
      }
    ).then((res) => res.json());

    const playerData = {
      discordId: id,
      username,
      discriminator,
      token: accessToken.token.access_token,
      refreshToken: accessToken.token.refresh_token,
      tokenExpires: dateFns.add(new Date(), {
        seconds: accessToken.token.expires_in,
      }),
    };

    const player = await db.player.upsert({
      create: playerData,
      update: playerData,
      where: { discordId: id },
    });

    log.debug("player", { player });

    if (req.session) {
      req.session.playerId = player.id;
    }

    res.redirect("http://localhost:3000");
  } catch (error) {
    log.error("Access Token Error", { error: error.message });
    res.end();
  }
});
