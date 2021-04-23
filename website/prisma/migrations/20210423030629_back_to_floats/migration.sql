/*
  Warnings:

  - You are about to alter the column `rating` on the `Rank` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to alter the column `ratingDeviation` on the `Rank` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to alter the column `ratingVolatility` on the `Rank` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to alter the column `rating` on the `RankState` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to alter the column `ratingChange` on the `RankState` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to alter the column `ratingDeviation` on the `RankState` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to alter the column `ratingVolatility` on the `RankState` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.

*/
-- AlterTable
ALTER TABLE "Rank" ALTER COLUMN "rating" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "ratingDeviation" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "ratingVolatility" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "RankState" ALTER COLUMN "rating" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "ratingChange" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "ratingDeviation" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "ratingVolatility" SET DATA TYPE DOUBLE PRECISION;
