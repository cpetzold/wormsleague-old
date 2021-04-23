-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "countryCode" TEXT,
    "avatar" TEXT,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "leagueId" TEXT NOT NULL,
    "replayUrl" TEXT NOT NULL,
    "logUrl" TEXT NOT NULL,
    "replayHash" TEXT,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "won" BOOLEAN NOT NULL,
    "teamName" TEXT NOT NULL,
    "teamColor" TEXT NOT NULL,
    "turnCount" INTEGER NOT NULL,
    "turnTime" INTEGER NOT NULL,
    "retreatTime" INTEGER NOT NULL,

    PRIMARY KEY ("userId","gameId")
);

-- CreateTable
CREATE TABLE "League" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rank" (
    "userId" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "rating" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "ratingDeviation" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "ratingVolatility" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY ("userId","leagueId")
);

-- CreateTable
CREATE TABLE "RankState" (
    "userId" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "gameStartedAt" TIMESTAMP(3) NOT NULL,
    "rating" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "ratingChange" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "ratingDeviation" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "ratingVolatility" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY ("userId","gameId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User.username_unique" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User.email_unique" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Game" ADD FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD FOREIGN KEY ("userId", "leagueId") REFERENCES "Rank"("userId", "leagueId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rank" ADD FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rank" ADD FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankState" ADD FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankState" ADD FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankState" ADD FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankState" ADD FOREIGN KEY ("userId", "leagueId") REFERENCES "Rank"("userId", "leagueId") ON DELETE CASCADE ON UPDATE CASCADE;
