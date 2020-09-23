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
  const sortedGames = sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
    games
  );
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Played</TableCell>
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
              createdAt,
              replayUrl,
              logUrl,
            }) => (
              <TableRow key={id}>
                <TableCell>{formatDateTime(startedAt)}</TableCell>
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
      createdAt
      replayUrl
      logUrl
    }
    ${InlinePlayer.fragments.player}
  `,
};
