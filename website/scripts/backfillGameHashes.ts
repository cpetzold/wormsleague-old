import { PrismaClient } from "@prisma/client";
import fetch from "node-fetch";
import hasha from "hasha";

const db = new PrismaClient(
  process.env.PROD_DATABASE_URL && {
    datasources: {
      db: {
        url: process.env.PROD_DATABASE_URL,
      },
    },
  }
);

async function main() {
  const games = await db.game.findMany();

  for (const game of games) {
    const res = await fetch(game.replayUrl);
    const replayHash = await hasha.fromStream(res.body);
    await db.game.update({ where: { id: game.id }, data: { replayHash } });
  }

  db.$disconnect();
}

main();
