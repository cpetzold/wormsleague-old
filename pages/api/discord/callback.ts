import * as dateFns from "date-fns";
import { NextApiResponse } from "next";
import { log } from "nexus";
import { PrismaClient } from "nexus-plugin-prisma/client";
import { authorizeConfig, discordOauth } from "../../../lib/discord";
import { ApiRequest, runMiddleware } from "../../../lib/apiUtils";
import { session } from "../../../lib/middleware";

export default async (req: ApiRequest, res: NextApiResponse) => {
  await runMiddleware(req, res, session);

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

    const db = new PrismaClient();

    const player = await db.player.upsert({
      create: playerData,
      update: playerData,
      where: { discordId: id },
    });

    log.debug("player", { player });

    if (req.session) {
      req.session.playerId = player.id;
    }

    res.writeHead(302, {
      Location: "/",
    });
    res.end();
  } catch (error) {
    log.error("Access Token Error", { error: error.message });
    res.end();
  }
};
