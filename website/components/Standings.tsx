import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@material-ui/core";

import Flag from "./Flag";
import NextLink from "next/link";
import { Standings_RankFragment } from "../lib/graphql/generated/client";
import gql from "graphql-tag";
import { ratingImage } from "../lib/rank";
import { sortWith } from "ramda";

export default function Standings({
  ranks,
}: {
  ranks: Standings_RankFragment[];
}) {
  const sortedRanks = sortWith([(a, b) => b.rating - a.rating], ranks);
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Place</TableCell>
            <TableCell>Player</TableCell>
            <TableCell>Country</TableCell>
            <TableCell>Rating</TableCell>
            <TableCell>Wins</TableCell>
            <TableCell>Losses</TableCell>
            <TableCell>Win %</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedRanks.map(
            (
              {
                user: { username, countryCode },
                place,
                rating,
                ratingDeviation,
                wins,
                losses,
              },
              i
            ) => (
              <TableRow key={username}>
                <TableCell>{place}</TableCell>
                <TableCell>
                  <NextLink href={`/${username}`}>
                    <Box
                      display="flex"
                      alignItems="center"
                      style={{ cursor: "pointer" }}
                    >
                      <img src={ratingImage(rating)} height="24" />
                      &ensp;
                      {username}
                    </Box>
                  </NextLink>
                </TableCell>
                <TableCell>
                  <Flag countryCode={countryCode} />
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    {Math.round(rating)}
                    <Typography variant="caption" color="textSecondary">
                      &nbsp;±&nbsp;{Math.round(ratingDeviation)}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>{wins}</TableCell>
                <TableCell>{losses}</TableCell>
                <TableCell>
                  {Math.round((wins / (wins + losses) || 0) * 100)}%
                </TableCell>
              </TableRow>
            )
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

Standings.fragments = {
  rank: gql`
    fragment Standings_rank on Rank {
      user {
        id
        username
        countryCode
      }
      place
      rating
      ratingDeviation
      ratingVolatility
      wins
      losses
    }
  `,
};
