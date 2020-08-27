import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

export async function login(
  db: PrismaClient,
  usernameOrEmail: string,
  password: string,
) {
  const [user] = await db.user.findMany(
    {
      where: {
        OR: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
      },
    },
  );

  if (!user || !await bcrypt.compare(password, user.password)) {
    throw new Error("Invalid username/password");
  }

  return user;
}
