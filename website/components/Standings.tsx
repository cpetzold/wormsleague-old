import Link from "next/link";
import Flag from "./Flag";
import {
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@material-ui/core";

export default function Standings({ players }) {
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Place</TableCell>
            <TableCell>Player</TableCell>
            <TableCell>Country</TableCell>
            <TableCell>Points</TableCell>
            <TableCell>Wins</TableCell>
            <TableCell>Losses</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {players.map(
            ({ username, countryCode, place, points, wins, losses }) => (
              <TableRow key={username}>
                <TableCell>{place}</TableCell>
                <TableCell>{username}</TableCell>
                <TableCell>
                  <Flag size={42} countryCode={countryCode} />
                </TableCell>
                <TableCell>{points}</TableCell>
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
