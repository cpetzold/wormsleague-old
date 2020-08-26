import fs from "fs";
import { arg } from "@nexus/schema";
// import { GraphQLUpload } from "graphql-upload";
import { schema } from "nexus";
import { Game, PrismaClient } from "nexus-plugin-prisma/client";
import parseGameLog from "../parseGameLog";
import { map } from "ramda";

// schema.scalarType({
//   name: GraphQLUpload.name,
//   asNexusMethod: "upload", // We set this to be used as a method later as `t.upload()` if needed
//   description: GraphQLUpload.description,
//   serialize: GraphQLUpload.serialize,
//   parseValue: GraphQLUpload.parseValue,
//   parseLiteral: GraphQLUpload.parseLiteral,
// });

schema.objectType({
  name: "User",
  definition(t) {
    t.model.id();
    t.model.username();
    t.model.discriminator();
    t.model.playedGames({ type: "Player" });
  },
});

schema.objectType({
  name: "Player",
  definition(t) {
    t.model.user();
  },
});

schema.objectType({
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

function getMe(ctx) {
  const userId = ctx.userId;
  if (!userId) return null;
  return ctx.db.user.findOne({ where: { id: userId } });
}

schema.queryType({
  definition(t) {
    t.field("me", {
      type: "User",
      async resolve(_root, args, ctx) {
        return getMe(ctx);
      },
    });

    t.list.field("users", {
      type: "User",
      resolve(_root, _args, ctx) {
        return ctx.db.user.findMany();
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

schema.mutationType({
  definition(t) {
    t.field("reportWin", {
      type: "Game",
      args: {
        loserId: arg({ type: "String", required: true }),
        replay: arg({ type: "String", required: true }),
      },
      async resolve(_root, { loserId, replay }, { db, userId }) {
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
