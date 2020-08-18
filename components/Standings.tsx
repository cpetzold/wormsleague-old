import { Box, Grid, Avatar, Flex } from "theme-ui";
import Link from "next/link";
import Flag from "./Flag";

export default function Standings({ players }) {
  return (
    <Grid
      sx={{
        gridTemplateColumns:
          "min-content auto min-content min-content min-content",
        columnGap: "medium",
        rowGap: "medium",
        alignItems: "center",
      }}
    >
      <Column>Rank</Column>
      <Column>Player</Column>
      <Column>Country</Column>
      <Column>Wins</Column>
      <Column>Losses</Column>
      {players.map(
        ({ username, avatar, clan, countryCode, rank, wins, losses }) => (
          <>
            <Box sx={{ justifySelf: "center" }}>{rank}</Box>
            <Flex sx={{ alignItems: "center" }}>
              <Avatar
                size={42}
                sx={{ backgroundColor: "border" }}
                src={avatar || `https://robohash.org/${username}.png`}
              />
              &ensp;
              {clan && (
                <>
                  <Link href="#">{clan.tag}</Link>&nbsp;
                </>
              )}
              {username}
            </Flex>
            <Flag size={42} countryCode={countryCode} />
            <Box>{wins}</Box>
            <Box>{losses}</Box>
          </>
        )
      )}
    </Grid>
  );
}

function Column({ children = null }) {
  return (
    <Box
      sx={{
        borderBottom: "1px solid",
        borderColor: "border",
        fontSize: "small",
        paddingBottom: "small",
      }}
    >
      {children}
    </Box>
  );
}
