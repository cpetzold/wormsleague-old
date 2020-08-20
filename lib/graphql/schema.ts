import { schema } from "nexus";

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
