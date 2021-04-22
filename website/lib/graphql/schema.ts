import * as np from "nexus-prisma";
import * as pc from "@prisma/client";

import { addIndex, head, map } from "ramda";
import {
  arg,
  list,
  makeSchema,
  mutationType,
  nonNull,
  objectType,
  queryType,
  scalarType,
  stringArg,
} from "nexus";

import { FileUpload } from "graphql-upload";
import FormData from "form-data";
import { GraphQLUpload } from "apollo-server-core";
import NexusPrismaScalars from "nexus-prisma/scalars";
import { NowRequest } from "@vercel/node";
import { ObjectDefinitionBlock } from "nexus/dist/blocks";
import { ServerResponse } from "http";
import { Storage } from "@google-cloud/storage";
import bcrypt from "bcrypt";
import fetch from "node-fetch";
import { format } from "date-fns";
import hasha from "hasha";
import { login } from "../auth";
import ms from "ms";
import { parseDuration } from "../wa";
import { updateRanks } from "../rank";

const SALT_ROUNDS = 10;

const credentials =
  process.env.GCLOUD_CREDENTIALS &&
  JSON.parse(Buffer.from(process.env.GCLOUD_CREDENTIALS, "base64").toString());

const storage = new Storage({
  projectId: "wormsleague",
  credentials,
});
const gamesBucket = storage.bucket("games.wormsleague.com");

type Context = {
  req: NowRequest & { session: Express.Session };
  res: ServerResponse;
  db: pc.PrismaClient;
};

const Upload = scalarType({
  name: GraphQLUpload.name,
  asNexusMethod: "upload",
  description: GraphQLUpload.description,
  serialize: GraphQLUpload.serialize,
  parseValue: GraphQLUpload.parseValue,
  parseLiteral: GraphQLUpload.parseLiteral,
});

const User = objectType({
  name: np.User.$name,
  definition(t) {
    const { id, username, countryCode, isAdmin, ranks } = np.User;

    t.field(id.name, id);
    t.field(username.name, username);
    t.field(countryCode.name, countryCode);
    t.field(isAdmin.name, isAdmin);

    t.field(ranks.name, {
      type: nonNull(list(nonNull(np.Rank.$name))),
      resolve(user: pc.User, args, { db }: Context) {
        return db.rank.findMany({ where: { userId: user.id } });
      },
    });
  },
});

const Player = objectType({
  name: np.Player.$name,
  definition(t) {
    const { user, rank, game } = np.Player;

    t.field(user.name, {
      type: user.type,
      resolve(player: pc.Player, _args, { db }: Context) {
        return db.user.findUnique({ where: { id: player.userId } });
      },
    });

    t.field(rank.name, {
      type: rank.type,
      resolve(player: pc.Player, _args, { db }: Context) {
        return db.rank.findUnique({
          where: {
            userId_leagueId: {
              leagueId: player.leagueId,
              userId: player.userId,
            },
          },
        });
      },
    });

    t.field(game.name, {
      type: game.type,
      resolve(player: pc.Player, _args, { db }: Context) {
        return db.game.findUnique({
          where: {
            id: player.gameId,
          },
        });
      },
    });

    t.field("snapshotRating", {
      type: "Float",
      async resolve(player: pc.Player, _args, { db }: Context) {
        const rankState = await db.rankState.findUnique({
          where: {
            userId_gameId: { userId: player.userId, gameId: player.gameId },
          },
        });

        return rankState && rankState.rating - rankState.ratingChange;
      },
    });

    t.field("ratingChange", {
      type: "Float",
      async resolve(player: pc.Player, _args, { db }: Context) {
        const rankState = await db.rankState.findUnique({
          where: {
            userId_gameId: { userId: player.userId, gameId: player.gameId },
          },
        });

        return rankState?.ratingChange;
      },
    });
  },
});

const Rank = objectType({
  name: np.Rank.$name,
  definition(t) {
    const {
      user,
      rating,
      ratingDeviation,
      ratingVolatility,
      wins,
      losses,
      playedGames,
    } = np.Rank;

    t.field(rating.name, rating);
    t.field(ratingDeviation.name, ratingDeviation);
    t.field(ratingVolatility.name, ratingVolatility);
    t.field(wins.name, wins);
    t.field(losses.name, losses);

    t.field(user.name, {
      type: user.type,
      resolve(rank: pc.Rank, _args, { db }: Context) {
        return db.user.findUnique({ where: { id: rank.userId } });
      },
    });

    t.field(playedGames.name, {
      type: nonNull(list(nonNull(np.Player.$name))),
      resolve(rank: pc.Rank, _args, { db }: Context) {
        return db.player.findMany({
          where: { userId: rank.userId, leagueId: rank.leagueId },
        });
      },
    });

    t.field("place", {
      type: "Int",
      async resolve({ leagueId, rating }: pc.Rank, _args, { db }: Context) {
        const ratingsAbove = await db.rank.findMany({
          select: { rating: true },
          where: { leagueId, rating: { gt: rating } },
          distinct: "rating",
        });

        return ratingsAbove.length + 1;
      },
    });
  },
});

const Game = objectType({
  name: np.Game.$name,
  definition(t) {
    const { id, createdAt, startedAt, duration, replayUrl, logUrl } = np.Game;
    t.field(id.name, id);
    t.field(createdAt.name, createdAt);
    t.field(startedAt.name, startedAt);
    t.field(duration.name, duration);
    t.field(replayUrl.name, replayUrl);
    t.field(logUrl.name, logUrl);

    t.field("winner", {
      type: np.Player.$name,
      async resolve(game, _args, { db }: Context) {
        return head(
          await db.player.findMany({ where: { gameId: game.id, won: true } })
        );
      },
    });
    t.field("loser", {
      type: np.Player.$name,
      async resolve(game, _args, { db }: Context) {
        return head(
          await db.player.findMany({ where: { gameId: game.id, won: false } })
        );
      },
    });
  },
});

const League = objectType({
  name: np.League.$name,
  definition(t) {
    const { id, name, ranks, games } = np.League;

    t.field(id.name, id);
    t.field(name.name, name);
    t.field(ranks.name, {
      type: nonNull(list(nonNull(np.Rank.$name))),
      resolve(league: pc.League, _args, { db }: Context) {
        return db.rank.findMany({ where: { leagueId: league.id } });
      },
    });

    t.field(games.name, {
      type: nonNull(list(nonNull(np.Game.$name))),
      resolve(league: pc.League, {}, { db }: Context) {
        return db.game.findMany({
          where: {
            leagueId: league.id,
          },
          take: 20,
          orderBy: {
            startedAt: "desc",
          },
        });
      },
    });
  },
});

const Query = queryType({
  definition(t) {
    t.field("me", {
      type: User,
      async resolve(
        _root,
        _args,
        {
          db,
          req: {
            session: { userId },
          },
        }: Context
      ) {
        if (!userId) return null;
        return db.user.findUnique({ where: { id: userId } });
      },
    });

    t.field("user", {
      type: User,
      args: {
        username: nonNull(stringArg()),
      },
      async resolve(_root, { username }, { db }: Context) {
        return db.user.findUnique({ where: { username } });
      },
    });

    t.field("users", {
      type: nonNull(list(nonNull(User))),
      resolve(_root, _args, { db }: Context) {
        return db.user.findMany();
      },
    });

    t.field("currentLeague", {
      type: League,
      async resolve(_root, _args, { db }: Context) {
        return db.league.findFirst();
      },
    });
  },
});

const Mutation = mutationType({
  definition(t) {
    t.field("signup", {
      type: User,
      args: {
        username: nonNull(stringArg()),
        email: nonNull(stringArg()),
        password: nonNull(stringArg()),
        countryCode: stringArg(),
        avatar: stringArg(),
      },
      async resolve(
        _root,
        { username, email, password, countryCode, avatar },
        { db, req }: Context
      ) {
        if (req.session.userId) {
          throw new Error("Already logged in");
        }

        const [league] = await db.league.findMany();

        const user = await db.user.create({
          data: {
            username,
            email,
            password: await bcrypt.hash(password, SALT_ROUNDS),
            countryCode,
            avatar,
            ranks: {
              create: {
                league: { connect: { id: league.id } },
              },
            },
          },
        });

        req.session.userId = user.id;

        return user;
      },
    });

    t.field("login", {
      type: User,
      args: {
        usernameOrEmail: nonNull(stringArg()),
        password: nonNull(stringArg()),
      },
      async resolve(
        _root,
        { usernameOrEmail, password },
        { db, req }: Context
      ) {
        if (req.session.userId) {
          throw new Error("Already logged in");
        }

        const user = await login(db, usernameOrEmail, password);
        req.session.userId = user.id;
        return user;
      },
    });

    t.field("logout", {
      type: "Boolean",
      async resolve(_root, _args, { req }: Context) {
        req.session.userId = null;
        return true;
      },
    });

    t.field("reportWin", {
      type: Game,
      args: {
        loserId: nonNull(stringArg()),
        replay: nonNull(arg({ type: "Upload" })),
      },
      async resolve(
        _root,
        { loserId, replay }: { loserId: string; replay: Promise<FileUpload> },
        {
          db,
          req: {
            session: { userId },
          },
        }: Context
      ) {
        if (userId === loserId) {
          throw new Error("You can't play yourself.");
        }

        const { filename: replayFilename, createReadStream } = await replay;
        const stream = createReadStream();

        await new Promise((resolve, reject) => {
          stream.once("readable", resolve);
        });

        const replayHash = await hasha.fromFile(stream.path as string);
        const gamesWithReplayHash = await db.game.findMany({
          where: { replayHash },
        });

        if (gamesWithReplayHash.length > 0) {
          throw new Error("This game has already been reported.");
        }

        const form = new FormData();
        form.append("replay", stream, { filename: replayFilename });

        const fetchRes = await fetch("https://waaas.zemke.io", {
          method: "POST",
          body: form,
          timeout: ms("20s"),
        });

        const gameJson = await fetchRes.json();
        const {
          startedAt,
          totalGameTimeElapsed,
          teams,
          teamTimeTotals,
        } = gameJson;

        if (teams.length !== 2) {
          throw new Error("Only 1v1 supported currently");
        }

        // TODO: Support more leagues
        const [winner, loser, [league]] = await Promise.all([
          db.user.findUnique({ where: { id: userId } }),
          db.user.findUnique({ where: { id: loserId } }),
          db.league.findMany(),
        ]);

        const filename = `${format(
          new Date(startedAt),
          "yyyy-MM-dd HH.mm.ss"
        )} [WL - ${league.name}] ${winner.username}, ${loser.username}`;

        await gamesBucket.upload(stream.path as string, {
          destination: `${filename}.WAgame`,
        });

        const game = await db.game.create({
          data: {
            league: { connect: { id: league.id } },
            duration: parseDuration(totalGameTimeElapsed),
            startedAt: new Date(startedAt),
            replayHash,
            replayUrl: `https://storage.googleapis.com/${gamesBucket.name}/${filename}.WAgame`,
            logUrl: `n/a`,
            players: {
              create: addIndex(map)(({ color, team, localPlayer }, i) => {
                const { turn, retreat, turnCount } = teamTimeTotals[i];
                return {
                  user: { connect: { id: localPlayer ? userId : loserId } },
                  rank: {
                    connect: {
                      userId_leagueId: {
                        userId: localPlayer ? userId : loserId,
                        leagueId: league.id,
                      },
                    },
                  },
                  retreatTime: parseDuration(retreat),
                  teamColor: color,
                  teamName: team,
                  turnCount,
                  turnTime: parseDuration(turn),
                  won: localPlayer,
                };
              }, teams),
            },
          },
        });

        await updateRanks(db, league.id, new Date(startedAt));

        return game;
      },
    });

    t.field("recomputeRanks", {
      type: "Boolean",
      args: {
        leagueId: nonNull(stringArg()),
      },
      async resolve(
        _root,
        { leagueId },
        {
          db,
          req: {
            session: { userId },
          },
        }: Context
      ) {
        const user = await db.user.findUnique({ where: { id: userId } });

        if (!user || !user.isAdmin) {
          throw new Error("Must be an admin");
        }

        await updateRanks(db, leagueId);
        return true;
      },
    });
  },
});

export default makeSchema({
  types: [
    NexusPrismaScalars,
    Query,
    Mutation,
    User,
    Player,
    Game,
    Upload,
    Rank,
    League,
  ],
  outputs: {
    schema: __dirname + "/generated/schema.graphql",
    typegen: __dirname + "/generated/typings.ts",
  },
});
