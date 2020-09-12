import { Box, Link, Typography } from "@material-ui/core";

import { InlinePlayer_PlayerFragment } from "../lib/graphql/generated/client";
import NextLink from "next/link";
import gql from "graphql-tag";
import { ratingImage } from "../lib/rank";

export default function InlinePlayer({
  player,
}: {
  player: InlinePlayer_PlayerFragment;
}) {
  const { snapshotRating, ratingChange } = player;

  return (
    <NextLink href={`/${player.user.username}`}>
      <Box display="flex" alignItems="center" style={{ cursor: "pointer" }}>
        {snapshotRating && (
          <>
            <img src={ratingImage(snapshotRating)} width="24" />
            &ensp;
          </>
        )}
        {player.user.username}
        &ensp;
        <Typography variant="caption" color="textSecondary">
          {Math.round(snapshotRating)}&nbsp;
        </Typography>
        <Typography
          variant="caption"
          color={ratingChange > 0 ? "secondary" : "error"}
        >
          {ratingChange > 0 && "+"}
          {Math.round(ratingChange)}
        </Typography>
      </Box>
    </NextLink>
  );
}

InlinePlayer.fragments = {
  player: gql`
    fragment InlinePlayer_player on Player {
      user {
        username
      }
      snapshotRating
      ratingChange
    }
  `,
};
