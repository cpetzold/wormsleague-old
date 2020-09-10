import Player, { Match, Outcome, createPlayerFactory } from "glicko-two";
import { PrismaClient } from "@prisma/client";
import { filter, mapObjIndexed, sort, sum, values } from "ramda";

export function ratingImage(rating: number) {
  if (rating > 1800) {
    return "/star.png";
  } else if (rating > 1600) {
    return "/rank3.png";
  } else if (rating > 1500) {
    return "/rank2.png";
  } else {
    return "/rank1.png";
  }
}

export const createGlickoPlayer = createPlayerFactory({
  defaultRating: 1500,
  defaultRatingDeviation: 350,
  defaultVolatility: 0.06,
  tau: 0.5,
});

export function createDefaultRank() {
  const {
    rating,
    ratingDeviation,
    volatility: ratingVolatility,
  } = createGlickoPlayer();
  return { rating, ratingDeviation, ratingVolatility };
}

class RecordedPlayer extends Player {
  wins: number;
  losses: number;
}

export async function updateRanks(db: PrismaClient, leagueId: string) {
  const glickoPlayers: { [userId: string]: RecordedPlayer } = {};
  const games = await db.game.findMany({ where: { leagueId } });
  const sortedGames = sort(
    (a, b) => a.startedAt.getTime() - b.startedAt.getTime(),
    games
  );

  await db.rank.updateMany({
    data: {
      losses: 0,
      wins: 0,
      ...createDefaultRank(),
    },
  });

  for (const game of sortedGames) {
    const players = await db.player.findMany({ where: { gameId: game.id } });

    const winner = players.find((p) => p.won);
    const loser = players.find((p) => !p.won);

    glickoPlayers[winner.userId] = (glickoPlayers[winner.userId] ||
      createGlickoPlayer()) as RecordedPlayer;

    glickoPlayers[loser.userId] = (glickoPlayers[loser.userId] ||
      createGlickoPlayer()) as RecordedPlayer;

    const winnerSnapshotRating = glickoPlayers[winner.userId].rating;
    const loserSnapshotRating = glickoPlayers[loser.userId].rating;

    glickoPlayers[winner.userId].wins++;
    glickoPlayers[loser.userId].losses++;

    const match = new Match(
      glickoPlayers[winner.userId],
      glickoPlayers[loser.userId]
    );
    match.reportTeamAWon();
    match.updatePlayerRatings();

    const winnerPlayerUpdate = db.player.update({
      where: {
        userId_gameId: { userId: winner.userId, gameId: game.id },
      },
      data: {
        snapshotRating: winnerSnapshotRating,
        ratingChange:
          glickoPlayers[winner.userId].rating - winnerSnapshotRating,
      },
    });

    const loserPlayerUpdate = db.player.update({
      where: { userId_gameId: { userId: loser.userId, gameId: game.id } },
      data: {
        snapshotRating: loserSnapshotRating,
        ratingChange: glickoPlayers[loser.userId].rating - loserSnapshotRating,
      },
    });

    await db.$transaction([winnerPlayerUpdate, loserPlayerUpdate]);
  }

  const rankUpdates = values(
    mapObjIndexed((player, userId) => {
      return db.rank.update({
        where: { userId_leagueId: { userId, leagueId } },
        data: {
          wins: player.wins,
          losses: player.losses,
          rating: player.rating,
          ratingDeviation: player.ratingDeviation,
          ratingVolatility: player.volatility,
        },
      });
    }, glickoPlayers)
  );

  await db.$transaction(rankUpdates);
}
