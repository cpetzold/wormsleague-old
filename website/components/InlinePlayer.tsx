import { Box, Typography } from "@material-ui/core";
import gql from "graphql-tag";
import { InlinePlayer_PlayerFragment } from "../lib/graphql/generated/client";
import { ratingImage } from "../lib/rank";

export default function InlinePlayer({
  player,
}: {
  player: InlinePlayer_PlayerFragment;
}) {
  const { snapshotRating, ratingChange } = player;

  return (
    <Box display="flex" alignItems="center">
      {snapshotRating && (
        <>
          <img src={ratingImage(snapshotRating)} width="24" />
          &ensp;
        </>
      )}
      {player.user.username}
      &ensp;
      <Typography
        variant="caption"
        color={ratingChange > 0 ? "textSecondary" : "error"}
      >
        {ratingChange > 0 && "+"}
        {Math.round(ratingChange)}
      </Typography>
    </Box>
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
