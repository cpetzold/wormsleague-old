import {
  Box,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from "@material-ui/core";
import { formatDateTime, formatDurationFromMs } from "../lib/time";

import DescriptionIcon from "@material-ui/icons/Description";
import { Games_GameFragment } from "../lib/graphql/generated/client";
import InlinePlayer from "./InlinePlayer";
import gql from "graphql-tag";
import { sort } from "ramda";

export default function Games({ games }: { games: Games_GameFragment[] }) {
  console.log(games);
  const sortedGames = sort((a, b) => b.reportedAt - a.reportedAt, games);
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Reported</TableCell>
            <TableCell>Winner</TableCell>
            <TableCell>Loser</TableCell>
            {/* <TableCell>Played</TableCell> */}
            {/* <TableCell>Duration</TableCell> */}
            <TableCell>Files</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedGames.map(
            ({
              id,
              winner,
              loser,
              duration,
              startedAt,
              reportedAt,
              replayUrl,
              logUrl,
            }) => (
              <TableRow key={id}>
                <TableCell>{formatDateTime(reportedAt)}</TableCell>
                <TableCell>
                  <InlinePlayer player={winner} />
                </TableCell>
                <TableCell>
                  <InlinePlayer player={loser} />
                </TableCell>
                {/* <TableCell>{formatDateTime(startedAt)}</TableCell>
                <TableCell>{formatDurationFromMs(duration)}</TableCell> */}
                <TableCell>
                  <Tooltip title="Replay" placement="top" arrow>
                    <Link href={replayUrl} download>
                      <img width={24} src="/icon.png" />
                    </Link>
                  </Tooltip>
                  &nbsp;
                  <Tooltip title="Log" placement="top" arrow>
                    <Link href={logUrl} download>
                      <DescriptionIcon color="action" />
                    </Link>
                  </Tooltip>
                </TableCell>
              </TableRow>
            )
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

Games.fragments = {
  game: gql`
    fragment Games_game on Game {
      id
      winner {
        ...InlinePlayer_player
      }
      loser {
        ...InlinePlayer_player
      }
      duration
      startedAt
      reportedAt
      replayUrl
      logUrl
    }
    ${InlinePlayer.fragments.player}
  `,
};
