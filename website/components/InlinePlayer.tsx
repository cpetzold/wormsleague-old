import { Avatar, Box } from "@material-ui/core";

import ArrowForwardIcon from "@material-ui/icons/ArrowForward";
import Flag from "./Flag";
import { InlinePlayer_PlayerFragment } from "../lib/graphql/generated/client";
import gql from "graphql-tag";
import { ratingImage } from "../lib/rank";

export default function InlinePlayer({
  player,
}: {
  player: InlinePlayer_PlayerFragment;
}) {
  const { snapshotRating, ratingChange } = player;
  const newRating = snapshotRating + ratingChange;

  return (
    <Box display="flex" alignItems="center">
      <Flag countryCode={player.user.countryCode} />
      &ensp;
      {snapshotRating && (
        <>
          <img src={ratingImage(snapshotRating)} width="24" />
          <ArrowForwardIcon fontSize="small" />
          <img src={ratingImage(newRating)} width="24" />
          &ensp;
        </>
      )}
      {player.user.username}
    </Box>
  );
}

InlinePlayer.fragments = {
  player: gql`
    fragment InlinePlayer_player on Player {
      user {
        username
        countryCode
      }
      snapshotRating
      ratingChange
    }
  `,
};
