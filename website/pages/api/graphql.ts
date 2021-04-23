import { NextApiRequest, NextApiResponse } from "next";

import { ApolloServer } from "apollo-server-micro";
import { PrismaClient } from "@prisma/client";
import cookieSession from "micro-cookie-session";
import ms from "ms";
import schema from "../../lib/graphql/schema";
import { send } from "micro";

const session = cookieSession({
  secret: process.env.SESSION_SECRET,
  maxAge: ms("1y"),
  httpOnly: false,
});

const prisma = new PrismaClient();

export const config = {
  api: {
    bodyParser: false,
  },
};

const server = new ApolloServer({
  schema,
  introspection: true,
  playground: true,
  context(ctx) {
    const { req } = ctx;
    return { ...ctx, db: prisma, prisma, userId: req.session?.userId };
  },
});

const handler = server.createHandler({ path: "/api/graphql" });

export default (req: NextApiRequest, res: NextApiResponse) => {
  session(req, res);

  if (req.method === "OPTIONS") {
    return send(res, 200);
  } else {
    return handler(req, res);
  }
};
