import Player, { Outcome, createPlayerFactory } from "glicko-two";
import { PrismaClient, Rank } from "@prisma/client";

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

const createGlickoPlayer = createPlayerFactory({
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

function getGlickoPlayer({ rating, ratingDeviation, ratingVolatility }: Rank) {
  return createGlickoPlayer({
    rating,
    ratingDeviation,
    volatility: ratingVolatility,
  });
}

export async function updateRanks(
  db: PrismaClient,
  leagueId: string,
  winnerUserId: string,
  loserUserId: string
) {
  const winnerWhere = { userId_leagueId: { userId: winnerUserId, leagueId } };
  const loserWhere = { userId_leagueId: { userId: loserUserId, leagueId } };
  const winnerRank = await db.rank.findOne({ where: winnerWhere });
  const loserRank = await db.rank.findOne({ where: loserWhere });

  const winnerGlickoPlayer = getGlickoPlayer(winnerRank);
  const loserGlickoPlayer = getGlickoPlayer(loserRank);

  winnerGlickoPlayer.addResult(loserGlickoPlayer, Outcome.Win);
  loserGlickoPlayer.addResult(winnerGlickoPlayer, Outcome.Loss);

  winnerGlickoPlayer.updateRating();
  loserGlickoPlayer.updateRating();

  await db.rank.update({
    where: winnerWhere,
    data: {
      rating: winnerGlickoPlayer.rating,
      ratingDeviation: winnerGlickoPlayer.ratingDeviation,
      ratingVolatility: winnerGlickoPlayer.volatility,
      wins: winnerRank.wins + 1,
    },
  });

  await db.rank.update({
    where: loserWhere,
    data: {
      rating: loserGlickoPlayer.rating,
      ratingDeviation: loserGlickoPlayer.ratingDeviation,
      ratingVolatility: loserGlickoPlayer.volatility,
      losses: loserRank.losses + 1,
    },
  });
}
