import { Grid, Box, Flex } from "theme-ui";
import Flag from "./Flag";

export default function Standings({ players }) {
  return (
    <Grid
      sx={{
        gridTemplateColumns: "min-content auto min-content min-content",
        columnGap: "medium",
        rowGap: "medium",
        alignItems: "center",
      }}
    >
      <Column>Rank</Column>
      <Column>Player</Column>
      <Column>Country</Column>
      <Column>Score</Column>
      {players.map(({ username, countryCode, score }, i) => (
        <>
          <Box>{i + 1}</Box>
          <Box>{username}</Box>
          <Flag countryCode={countryCode} />
          <Box>{score}</Box>
        </>
      ))}
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
