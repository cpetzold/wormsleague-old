import Player, { Match, Outcome, createPlayerFactory } from "glicko-two";
import { PrismaClient, RankState, RankUpdateInput } from "@prisma/client";
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

function getGlickoPlayer(rankState: RankState) {
  return {
    player: createGlickoPlayer({
      rating: rankState && rankState.rating,
      ratingDeviation: rankState && rankState.ratingDeviation,
      volatility: rankState && rankState.ratingVolatility,
    }),
    wins: rankState ? rankState.wins : 0,
    losses: rankState ? rankState.losses : 0,
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
  const allPlayers = await db.player.findMany();

  const sortedGames = sort(
    (a, b) => a.startedAt.getTime() - b.startedAt.getTime(),
    games
  );

  await db.rankState.deleteMany({
    where: { gameId: { in: games.map((game) => game.id) } },
  });

  const allRankStates = await db.rankState.findMany({
    orderBy: { gameStartedAt: "desc" },
  });

  const newRankStates = [];

  console.time("updateRanks");

  for (const game of sortedGames) {
    const winner = allPlayers.find((p) => p.gameId === game.id && p.won);
    const loser = allPlayers.find((p) => p.gameId === game.id && !p.won);

    glickoPlayers[winner.userId] =
      glickoPlayers[winner.userId] ||
      getGlickoPlayer(
        allRankStates.find(
          (r) => r.userId === winner.userId && r.leagueId === leagueId
        )
      );

    glickoPlayers[loser.userId] =
      glickoPlayers[loser.userId] ||
      getGlickoPlayer(
        allRankStates.find(
          (r) => r.userId === loser.userId && r.leagueId === leagueId
        )
      );

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
      return {
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
      };
    }

    const winnerRankState = createRankState(
      winner.userId,
      winnerPreviousRating
    );
    const loserRankState = createRankState(loser.userId, loserPreviousRating);

    newRankStates.concat([winnerRankState, loserRankState]);
  }

  console.timeEnd("updateRanks");

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
