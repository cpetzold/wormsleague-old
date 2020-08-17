import app, { schema, server, use } from "nexus";
import { prisma } from "nexus-plugin-prisma";
import "../../lib/graphql/schema";
import { runMiddleware } from "../../lib/apiUtils";
import { session } from "../../lib/middleware";
import { ContextAdder } from "nexus/dist/runtime/schema";
import { ContextAdderLens } from "nexus/dist/runtime/schema/schema";

use(prisma());
app.assemble();

type RequestWithSession = Request & {
  session: {
    playerId?: string;
  };
};

schema.addToContext(
  async ({ req, res }: ContextAdderLens & { req: RequestWithSession }) => {
    await runMiddleware(req, res, session);
    return {
      playerId: req.session?.playerId as string,
    };
  }
);

export default server.handlers.graphql;
