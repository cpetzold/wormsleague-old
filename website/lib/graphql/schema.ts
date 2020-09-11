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
import { head, map } from "ramda";

import { FileUpload } from "graphql-upload";
import FormData from "form-data";
import { GraphQLUpload } from "apollo-server-core";
import { NowRequest } from "@vercel/node";
import { PrismaClient } from "@prisma/client";
import { ServerResponse } from "http";
import { Storage } from "@google-cloud/storage";
import bcrypt from "bcrypt";
import fetch from "node-fetch";
import { format } from "date-fns";
import hasha from "hasha";
import { login } from "../auth";
import { nexusSchemaPrisma } from "nexus-plugin-prisma/schema";
import { parseGameLog } from "../wa";

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
  },
});

const Player = objectType({
  name: "Player",
  definition(t) {
    t.model.user();
    t.model.rank();
    t.model.snapshotRating();
    t.model.ratingChange();
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
  },
});

const Game = objectType({
  name: "Game",
  definition(t) {
    t.model.id();
    t.model.createdAt();
    t.model.reportedAt();
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
    t.model.games();
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
                ...createDefaultRank(),
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
      async resolve(_root, _args, { req }) {
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

        const fetchRes = await fetch("http://34.94.165.86:8080/", {
          method: "POST",
          body: form,
          timeout: 5000,
        });

        const gameLog = await fetchRes.text();
        const { startedAt, duration, players } = parseGameLog(gameLog);

        if (players.length !== 2) {
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

        const logFile = gamesBucket.file(`${filename}.log`);
        await logFile.save(gameLog);

        const game = await db.game.create({
          data: {
            league: { connect: { id: league.id } },
            duration,
            startedAt,
            reportedAt: new Date(),
            replayHash,
            replayUrl: `https://storage.googleapis.com/${gamesBucket.name}/${filename}.WAgame`,
            logUrl: `https://storage.googleapis.com/${gamesBucket.name}/${filename}.log`,
            players: {
              create: map(
                ({
                  teamName,
                  teamColor,
                  local,
                  turnCount,
                  turnTime,
                  retreatTime,
                }) => ({
                  user: { connect: { id: local ? userId : loserId } },
                  rank: {
                    connect: {
                      userId_leagueId: {
                        userId: local ? userId : loserId,
                        leagueId: league.id,
                      },
                    },
                  },
                  retreatTime,
                  teamColor,
                  teamName,
                  turnCount,
                  turnTime,
                  won: local,
                }),
                players
              ),
            },
          },
        });

        await updateRanks(db, league.id);

        return game;
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
