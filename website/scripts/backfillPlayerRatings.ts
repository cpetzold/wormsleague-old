import Player, { Match } from "glicko-two";

import { PrismaClient } from "@prisma/client";
import { createGlickoPlayer } from "../lib/rank";

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
  const glickoPlayers: { [userId: string]: Player } = {};

  const games = await db.game.findMany();
  const sortedGames = games.sort(
    (a, b) => a.startedAt.getTime() - b.startedAt.getTime()
  );

  for (const game of sortedGames) {
    const players = await db.player.findMany({ where: { gameId: game.id } });

    const winner = players.find((p) => p.won);
    const loser = players.find((p) => !p.won);

    glickoPlayers[winner.userId] =
      glickoPlayers[winner.userId] || createGlickoPlayer();

    glickoPlayers[loser.userId] =
      glickoPlayers[loser.userId] || createGlickoPlayer();

    const winnerSnapshotRating = glickoPlayers[winner.userId].rating;
    const loserSnapshotRating = glickoPlayers[loser.userId].rating;

    const match = new Match(
      glickoPlayers[winner.userId],
      glickoPlayers[loser.userId]
    );
    match.reportTeamAWon();
    match.updatePlayerRatings();

    await db.player.update({
      where: {
        userId_gameId: { userId: winner.userId, gameId: winner.gameId },
      },
      data: {
        snapshotRating: winnerSnapshotRating,
        ratingChange:
          glickoPlayers[winner.userId].rating - winnerSnapshotRating,
      },
    });

    await db.player.update({
      where: { userId_gameId: { userId: loser.userId, gameId: loser.gameId } },
      data: {
        snapshotRating: loserSnapshotRating,
        ratingChange: glickoPlayers[loser.userId].rating - loserSnapshotRating,
      },
    });
  }

  db.$disconnect();
}

main();
