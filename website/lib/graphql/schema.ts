import {
  arg,
  makeSchema,
  mutationType,
  objectType,
  queryType,
  scalarType,
  stringArg,
} from "@nexus/schema";
import { PrismaClient } from "@prisma/client";
import { MicroRequest } from "apollo-server-micro/dist/types";
import bcrypt from "bcrypt";
import { GraphQLUpload } from "graphql-upload";
import { ServerResponse } from "http";
import { nexusSchemaPrisma } from "nexus-plugin-prisma/schema";
import { map } from "ramda";
import { login } from "../auth";
import parseGameLog from "../parseGameLog";

const SALT_ROUNDS = 10;

type Context = {
  req: MicroRequest & { session: Express.Session };
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
    t.model.playedGames();
  },
});

const Player = objectType({
  name: "Player",
  definition(t) {
    t.model.user();
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
        { db, req: { session: { userId } } }: Context,
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
  },
});

function upsertUserRank(db: PrismaClient, userId: string, leagueId: string) {
  return db.rank.upsert({
    create: {
      league: { connect: { id: leagueId } },
      user: { connect: { id: userId } },
    },
    update: {
      league: { connect: { id: leagueId } },
      user: { connect: { id: userId } },
    },
    where: {
      userId_leagueId: { userId, leagueId },
    },
  });
}

const Mutation = mutationType({
  definition(t) {
    t.field("signup", {
      type: "User",
      args: {
        username: stringArg({ required: true }),
        email: stringArg({ required: true }),
        password: stringArg({ required: true }),
      },
      async resolve(
        _root,
        { username, email, password },
        { db, req }: Context,
      ) {
        if (req.session.userId) {
          throw new Error("Already logged in");
        }

        const user = await db.user.create({
          data: {
            username,
            email,
            password: await bcrypt.hash(password, SALT_ROUNDS),
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
        { db, req }: Context,
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
        { loserId, replay },
        { db, req: { session: { userId } } },
      ) {
        const { startedAt, duration, players } = parseGameLog(replay);

        if (players.length !== 2) {
          throw new Error("Only 1v1 supported currently");
        }

        if (userId === loserId) {
          throw new Error("You can't play yourself");
        }

        // TODO: Support more leagues
        const [league] = await db.league.findMany();

        await upsertUserRank(db, userId, league.id);
        await upsertUserRank(db, loserId, league.id);

        return db.game.create({
          data: {
            duration,
            startedAt,
            reportedAt: new Date(),
            players: {
              create: map(
                (
                  {
                    teamName,
                    teamColor,
                    won,
                    turnCount,
                    turnTime,
                    retreatTime,
                  },
                ) => ({
                  user: { connect: { id: won ? userId : loserId } },
                  rank: {
                    connect: {
                      userId_leagueId: {
                        userId: won ? userId : loserId,
                        leagueId: league.id,
                      },
                    },
                  },
                  retreatTime,
                  teamColor,
                  teamName,
                  turnCount,
                  turnTime,
                  won,
                }),
                players,
              ),
            },
          },
        });
      },
    });
  },
});

export default makeSchema({
  types: [Query, Mutation, User, Player, Game, Upload],
  outputs: {
    schema: __dirname + "/generated/schema.graphql",
    typegen: __dirname + "/generated/typings.ts",
  },
  plugins: [nexusSchemaPrisma({ experimentalCRUD: true })],
});
