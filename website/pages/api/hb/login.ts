import { NextApiResponse, NextApiRequest } from "next";
import { PrismaClient } from "@prisma/client";
import { login } from "../../../lib/auth";
import { pick } from "ramda";

const db = new PrismaClient();

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { usernameOrEmail, password } = req.body;

  try {
    const user = await login(db, usernameOrEmail, password);
    res.json(pick(["id", "username"], user));
  } catch (error) {
    res.statusCode = 400;
    res.send(error.message);
  }
};
