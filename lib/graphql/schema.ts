import { log, schema } from "nexus";

schema.objectType({
  name: "Player",
  definition(t) {
    t.model.id();
    t.model.username();
    t.model.discriminator();
  },
});

schema.objectType({
  name: "Match",
  definition(t) {
    t.model.id();
    t.model.reportedAt();
  },
});

function getMe(ctx) {
  const playerId = ctx.playerId;
  if (!playerId) return null;
  return ctx.db.player.findOne({ where: { id: playerId } });
}

schema.queryType({
  definition(t) {
    t.field("me", {
      type: "Player",
      async resolve(_root, args, ctx) {
        return getMe(ctx);
      },
    });

    t.list.field("players", {
      type: "Player",
      resolve(_root, _args, ctx) {
        return ctx.db.player.findMany();
      },
    });
  },
});

// schema.mutationType({
//   definition(t) {
//     t.field("joinQueue", {
//       type: "Player",
//       args: {
//         modes: schema.arg({
//           type: "Mode",
//           list: true,
//           nullable: false,
//         }),
//       },
//       async resolve(_root, args, ctx) {
//         const me = await getMe(ctx);
//         if (!me) {
//           throw new Error("Must be logged in");
//         }

//         return me;
//       },
//     });

//     t.field("leaveQueue", {
//       type: "Player",
//       async resolve(_root, _args, ctx) {
//         const me = await getMe(ctx);
//         if (!me) {
//           throw new Error("Must be logged in");
//         }

//         return me;
//       },
//     });

//     t.field("reportMatch", {
//       type: "Match",
//       args: {
//         matchId: "String",
//         won: "Boolean",
//       },
//       async resolve(_root, args, ctx) {
//         log.debug("?", { _root, args });
//       },
//     });
//   },
// });
