import { Box, Flex, Grid, Heading } from "theme-ui";
import Link from "next/link";

export default function Page({ children }) {
  return (
    <Flex sx={{ flexDirection: "row", justifyContent: "center" }}>
      <Flex
        sx={{
          flexDirection: "column",
          width: "100%",
          maxWidth: 920,
          padding: "large",
          backgroundColor: "backgroundOverlay",
        }}
      >
        <Header />
        {children}
      </Flex>

      <Box
        sx={{
          width: "100vw",
          height: "100vh",
          position: "fixed",
          background: "url(/terrain.png) no-repeat bottom center",
          zIndex: -1,
        }}
      />
    </Flex>
  );
}

function Header() {
  return (
    <Flex sx={{ justifyContent: "space-between", paddingY: "medium" }}>
      <Heading>Worms League</Heading>
      <Grid sx={{ gridAutoFlow: "column", gap: "medium" }}>
        <Link href="#">Standings</Link>
        <Link href="#">Players</Link>
      </Grid>
    </Flex>
  );
}
