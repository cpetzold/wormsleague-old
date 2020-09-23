import Player, { Match, Outcome, createPlayerFactory } from "glicko-two";
import { PrismaClient, RankUpdateInput } from "@prisma/client";
import {
  filter,
  forEachObjIndexed,
  head,
  mapObjIndexed,
  sort,
  sum,
  values,
} from "ramda";

export function ratingImage(rating: number) {
  if (rating > 1700) {
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

async function getGlickoPlayer(
  db: PrismaClient,
  leagueId: string,
  userId: string
) {
  const rankStates = await db.rankState.findMany({
    where: { userId, leagueId },
    take: 1,
    orderBy: { gameStartedAt: "desc" },
  });
  const latestState = head(rankStates);

  return {
    player: createGlickoPlayer({
      rating: latestState && latestState.rating,
      ratingDeviation: latestState && latestState.ratingDeviation,
      volatility: latestState && latestState.ratingVolatility,
    }),
    wins: latestState ? latestState.wins : 0,
    losses: latestState ? latestState.losses : 0,
  };
}

export async function updateRanks(
  db: PrismaClient,
  leagueId: string,
  since?: Date
) {
  const glickoPlayers: {
    [userId: string]: { player: Player; wins: number; losses: number };
  } = {};
  const games = await db.game.findMany({
    where: { leagueId, startedAt: { gte: since } },
  });
  const sortedGames = sort(
    (a, b) => a.startedAt.getTime() - b.startedAt.getTime(),
    games
  );

  await db.rankState.deleteMany({
    where: { gameId: { in: games.map((game) => game.id) } },
  });

  for (const game of sortedGames) {
    const players = await db.player.findMany({ where: { gameId: game.id } });

    const winner = players.find((p) => p.won);
    const loser = players.find((p) => !p.won);

    glickoPlayers[winner.userId] =
      glickoPlayers[winner.userId] ||
      (await getGlickoPlayer(db, leagueId, winner.userId));

    glickoPlayers[loser.userId] =
      glickoPlayers[loser.userId] ||
      (await getGlickoPlayer(db, leagueId, loser.userId));

    glickoPlayers[winner.userId].wins += 1;
    glickoPlayers[loser.userId].losses += 1;

    const winnerPreviousRating = glickoPlayers[winner.userId].player.rating;
    const loserPreviousRating = glickoPlayers[loser.userId].player.rating;

    const match = new Match(
      glickoPlayers[winner.userId].player,
      glickoPlayers[loser.userId].player
    );
    match.reportTeamAWon();
    match.updatePlayerRatings();

    function createRankState(userId: string, previousRating: number) {
      return db.rankState.create({
        data: {
          user: { connect: { id: userId } },
          league: { connect: { id: leagueId } },
          rank: {
            connect: { userId_leagueId: { userId: userId, leagueId } },
          },
          game: { connect: { id: game.id } },
          gameStartedAt: game.startedAt,
          rating: glickoPlayers[userId].player.rating,
          ratingChange: glickoPlayers[userId].player.rating - previousRating,
          ratingDeviation: glickoPlayers[userId].player.ratingDeviation,
          ratingVolatility: glickoPlayers[userId].player.volatility,
          wins: glickoPlayers[userId].wins,
          losses: glickoPlayers[userId].losses,
        },
      });
    }

    const winnerRankState = createRankState(
      winner.userId,
      winnerPreviousRating
    );
    const loserRankState = createRankState(loser.userId, loserPreviousRating);

    await db.$transaction([winnerRankState, loserRankState]);
  }

  await db.$transaction(
    values(
      mapObjIndexed(({ wins, losses, player }, userId) => {
        return db.rank.update({
          where: { userId_leagueId: { userId, leagueId } },
          data: {
            rating: player.rating,
            ratingDeviation: player.ratingDeviation,
            ratingVolatility: player.volatility,
            wins,
            losses,
          },
        });
      }, glickoPlayers)
    )
  );
}
