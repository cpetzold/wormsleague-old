import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@material-ui/core";

import Flag from "./Flag";
import { Standings_RankFragment } from "../lib/graphql/generated/client";
import gql from "graphql-tag";
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
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedRanks.map(
            ({ user: { username, countryCode }, rating, wins, losses }, i) => (
              <TableRow key={username}>
                <TableCell>{i + 1}</TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    {username}
                  </Box>
                </TableCell>
                <TableCell>
                  <Flag countryCode={countryCode} />
                </TableCell>
                <TableCell>{Math.round(rating)}</TableCell>
                <TableCell>{wins}</TableCell>
                <TableCell>{losses}</TableCell>
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
        username
        countryCode
      }
      rating
      ratingDeviation
      ratingVolatility
      wins
      losses
    }
  `,
};
