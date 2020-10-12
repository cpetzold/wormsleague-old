import { PrismaClient } from "@prisma/client";
import { updateRanks } from "../lib/rank";

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
  await updateRanks(db, "s1-t17");

  db.$disconnect();
}

main();
