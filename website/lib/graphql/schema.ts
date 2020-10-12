import {
  Player as PlayerType,
  PrismaClient,
  Rank as RankType,
} from "@prisma/client";
import {
  arg,
  makeSchema,
  mutationType,
  objectType,
  queryType,
  scalarType,
  stringArg,
} from "@nexus/schema";
import { createDefaultRank, updateRanks } from "../rank";
import { addIndex, head, map } from "ramda";

import { FileUpload } from "graphql-upload";
import FormData from "form-data";
import { GraphQLUpload } from "apollo-server-core";
import { NowRequest } from "@vercel/node";
import { ServerResponse } from "http";
import { Storage } from "@google-cloud/storage";
import bcrypt from "bcrypt";
import fetch from "node-fetch";
import { format } from "date-fns";
import hasha from "hasha";
import { login } from "../auth";
import { nexusSchemaPrisma } from "nexus-plugin-prisma/schema";
import { parseGameLog } from "../wa";
import ms from "ms";

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
  db: PrismaClient;
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
  name: "User",
  definition(t) {
    t.model.id();
    t.model.username();
    t.model.countryCode();
    t.model.playedGames();
    t.model.ranks();
    t.model.isAdmin();
  },
});

const Player = objectType({
  name: "Player",
  definition(t) {
    t.model.user();
    t.model.rank();
    t.model.game();
    t.field("snapshotRating", {
      type: "Float",
      nullable: true,
      async resolve(player: PlayerType, _args, { db }: Context) {
        const rankState = await db.rankState.findOne({
          where: {
            userId_gameId: { userId: player.userId, gameId: player.gameId },
          },
        });

        return rankState && rankState.rating - rankState.ratingChange;
      },
    });
    t.field("ratingChange", {
      type: "Float",
      nullable: true,
      async resolve(player: PlayerType, _args, { db }: Context) {
        const rankState = await db.rankState.findOne({
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
  name: "Rank",
  definition(t) {
    t.model.user();
    t.model.league();
    t.model.rating();
    t.model.ratingDeviation();
    t.model.ratingVolatility();
    t.model.wins();
    t.model.losses();
    t.model.playedGames();

    t.field("place", {
      type: "Int",
      async resolve({ leagueId, rating }: RankType, _args, { db }: Context) {
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
  name: "Game",
  definition(t) {
    t.model.id();
    t.model.createdAt();
    t.model.startedAt();
    t.model.duration();
    t.model.players();
    t.model.replayUrl();
    t.model.logUrl();
    t.field("winner", {
      type: "Player",
      async resolve(game, _args, { db }: Context) {
        return head(
          await db.player.findMany({ where: { gameId: game.id, won: true } })
        );
      },
    });
    t.field("loser", {
      type: "Player",
      async resolve(game, _args, { db }: Context) {
        return head(
          await db.player.findMany({ where: { gameId: game.id, won: false } })
        );
      },
    });
  },
});

const League = objectType({
  name: "League",
  definition(t) {
    t.model.id();
    t.model.name();
    t.model.ranks();
    t.model.games({ ordering: { startedAt: true } });
  },
});

const Query = queryType({
  definition(t) {
    t.field("me", {
      type: "User",
      nullable: true,
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
        return db.user.findOne({ where: { id: userId } });
      },
    });

    t.field("user", {
      type: "User",
      args: {
        username: stringArg(),
      },
      async resolve(_root, { username }, { db }: Context) {
        return db.user.findOne({ where: { username } });
      },
    });

    t.list.field("users", {
      type: "User",
      resolve(_root, _args, { db }: Context) {
        return db.user.findMany();
      },
    });

    t.field("currentLeague", {
      type: "League",
      async resolve(_root, _args, { db }: Context) {
        const [league] = await db.league.findMany();
        return league;
      },
    });
  },
});

const Mutation = mutationType({
  definition(t) {
    t.field("signup", {
      type: "User",
      args: {
        username: stringArg({ required: true }),
        email: stringArg({ required: true }),
        password: stringArg({ required: true }),
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
      type: "User",
      args: {
        usernameOrEmail: stringArg({ required: true }),
        password: stringArg({ required: true }),
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
      type: "Game",
      args: {
        loserId: stringArg({ required: true }),
        replay: arg({ type: "Upload", required: true }),
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
        const { startedAt, totalGameTimeElapsed, teams, teamTimeTotals } = gameJson;

        if (teams.length !== 2) {
          throw new Error("Only 1v1 supported currently");
        }

        // TODO: Support more leagues
        const [winner, loser, [league]] = await Promise.all([
          db.user.findOne({ where: { id: userId } }),
          db.user.findOne({ where: { id: loserId } }),
          db.league.findMany(),
        ]);

        const filename = `${format(startedAt, "yyyy-MM-dd HH.mm.ss")} [WL - ${
          league.name
        }] ${winner.username}, ${loser.username}`;

        await gamesBucket.upload(stream.path as string, {
          destination: `${filename}.WAgame`,
        });

        const game = await db.game.create({
          data: {
            league: { connect: { id: league.id } },
            duration: totalGameTimeElapsed,
            startedAt: new Date(startedAt),
            replayHash,
            replayUrl: `https://storage.googleapis.com/${gamesBucket.name}/${filename}.WAgame`,
            logUrl: null,
            players: {
              create: addIndex(map)(
                ({
                  color,
                  team,
                  localPlayer
                }, i) => {
                  const { turn, retreat, turnCount } = teamTimeTotals[i]
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
                    retreatTime: retreat,
                    teamColor: color,
                    teamName: team,
                    turnCount,
                    turnTime: turn,
                    won: localPlayer,
                  }
                },
                teams
              ),
            },
          },
        });

        await updateRanks(db, league.id, startedAt);

        return game;
      },
    });

    t.field("recomputeRanks", {
      type: "Boolean",
      args: {
        leagueId: stringArg({ required: true }),
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
        const user = await db.user.findOne({ where: { id: userId } });

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
  types: [Query, Mutation, User, Player, Game, Upload, Rank, League],
  outputs: {
    schema: __dirname + "/generated/schema.graphql",
    typegen: __dirname + "/generated/typings.ts",
  },
  plugins: [nexusSchemaPrisma()],
});
