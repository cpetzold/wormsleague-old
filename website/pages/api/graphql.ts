import app, {
  schema,
  server,
  use,
} from "nexus";
import { prisma } from "nexus-plugin-prisma";
import "../../lib/graphql/schema";
import { runMiddleware } from "../../lib/apiUtils";
import { session } from "../../lib/middleware";
import { ContextAdderLens } from "nexus/dist/runtime/schema/schema";

export const config = {
  api: {
    bodyParser: false,
  },
};

use(prisma());
app.assemble();

type RequestWithSession = Request & {
  session: {
    userId?: string;
  };
};

schema.addToContext(
  async ({ req, res }: ContextAdderLens & { req: RequestWithSession }) => {
    await runMiddleware(req, res, session);
    return {
      userId: req.session?.userId as string,
    };
  },
);

export default server.handlers.graphql;
