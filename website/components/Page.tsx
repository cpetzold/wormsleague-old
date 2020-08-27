import Head from "next/head";
import NextLink from "next/link";
import { Box, Flex, Grid, Heading, Text, Link } from "theme-ui";
import { useRouter } from "next/dist/client/router";

export default function Page({ children }) {
  return (
    <Flex sx={{ flexDirection: "row", justifyContent: "center" }}>
      <Head>
        <title>Worms League</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Flex
        sx={{
          flexDirection: "column",
          width: "100%",
          maxWidth: 920,
          padding: 4,
          minHeight: "100vh",
        }}
      >
        <Header />
        <Flex sx={{ flexDirection: "column", paddingY: 4, flex: 1 }}>
          {children}
        </Flex>
      </Flex>

      <Box
        sx={{
          width: "100vw",
          height: "100vh",
          position: "fixed",
          background: "url(/terrain.png) no-repeat bottom center",
          opacity: 0.05,
          zIndex: -1,
        }}
      />
    </Flex>
  );
}

function Header() {
  return (
    <Flex sx={{ justifyContent: "space-between", paddingY: "medium" }}>
      <NextLink href="/">
        <Heading sx={{ cursor: "pointer" }}>Worms League</Heading>
      </NextLink>
      <Grid sx={{ gridAutoFlow: "column", gap: 4 }}>
        <NavLink href="/">Standings</NavLink>
        {/* <NavLink href="/about">About</NavLink> */}
        <NavLink href="/signup">Sign up</NavLink>
        <NavLink href="/login">Log in</NavLink>
      </Grid>
    </Flex>
  );
}

function NavLink({ href, children }) {
  const router = useRouter();
  const active = router.pathname === href;
  return (
    <NextLink href={href} passHref>
      <Link sx={{ color: active ? "text" : "muted" }}>{children}</Link>
    </NextLink>
  );
}
