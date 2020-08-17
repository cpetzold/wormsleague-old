import { Mode, PrismaClient } from "@prisma/client";

const db = new PrismaClient();

main();

async function main() {
  const player = await db.player.create({
    data: {
      name: "Syc",
      ranks: {
        create: {
          mode: Mode.SOLO,
          points: 1200,
        },
      },
    },
  });

  console.log("Seeded: %j", player);

  db.disconnect();
}
