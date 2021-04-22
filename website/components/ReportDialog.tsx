import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Theme,
  Typography,
  createStyles,
  makeStyles,
} from "@material-ui/core";
import {
  ReportQuery,
  ReportQueryVariables,
  ReportWinMutation,
  ReportWinMutationVariables,
} from "../lib/graphql/generated/client";
import { useMutation, useQuery } from "@apollo/client";
import { useRef, useState } from "react";

import Autocomplete from "@material-ui/lab/Autocomplete";
import { HOME_QUERY } from "../pages/index";
import gql from "graphql-tag";

const REPORT_QUERY = gql`
  query Report {
    me {
      id
    }
    users {
      id
      username
    }
  }
`;

const REPORT_WIN_MUTATION = gql`
  mutation ReportWin($loserId: String!, $replay: Upload!) {
    reportWin(loserId: $loserId, replay: $replay) {
      id
    }
  }
`;

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    wrapper: {
      margin: theme.spacing(1),
      position: "relative",
    },
    buttonProgress: {
      position: "absolute",
      top: "50%",
      left: "50%",
      marginTop: -12,
      marginLeft: -12,
    },
  })
);

export default function ReportDialog({ open, onSuccess, onClose }) {
  const classes = useStyles();
  const fileInputRef = useRef<HTMLInputElement>();
  const { loading: dataLoading, data } = useQuery<
    ReportQuery,
    ReportQueryVariables
  >(REPORT_QUERY, { skip: !open });
  const [loser, setLoser] = useState(null);
  const [replay, setReplay] = useState<File>(null);

  const handleClose = () => {
    setLoser(null);
    setReplay(null);
    fileInputRef.current.value = null;
    onClose();
  };

  const [reportWin, { loading }] = useMutation<
    ReportWinMutation,
    ReportWinMutationVariables
  >(REPORT_WIN_MUTATION, { refetchQueries: [{ query: HOME_QUERY }] });

  if (dataLoading) return null;

  const { me, users } = data;
  const possibleLosers = users.filter(({ id }) => id !== me.id);
  return (
    <Dialog open={open} onClose={handleClose}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();

          await reportWin({
            variables: {
              loserId: loser.id,
              replay,
            },
          });

          setLoser(null);
          setReplay(null);
          onSuccess();
        }}
      >
        <DialogTitle>Report win</DialogTitle>
        <DialogContent>
          <Box minWidth={400}>
            <Autocomplete
              options={possibleLosers}
              value={loser}
              onChange={(e, value) => setLoser(value)}
              getOptionLabel={(user) => user.username}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Loser"
                  variant="outlined"
                  margin="normal"
                />
              )}
            />
            <label>
              <input
                ref={fileInputRef}
                id="replay"
                type="file"
                accept=".WAgame"
                disabled={loading}
                onChange={async ({ target: { files } }) => {
                  setReplay(files[0]);
                }}
                style={{ display: "none" }}
              />
              <Box display="flex" alignItems="center" mt={1}>
                <Box flexShrink={0}>
                  <Button
                    variant="contained"
                    component="span"
                    disabled={loading}
                  >
                    Select replay
                  </Button>
                </Box>
                &emsp;
                <Typography noWrap>{replay?.name}</Typography>
              </Box>
            </label>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <div className={classes.wrapper}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              disabled={!loser || !replay || loading}
            >
              Report
            </Button>
            {loading && (
              <CircularProgress size={24} className={classes.buttonProgress} />
            )}
          </div>
        </DialogActions>
      </form>
    </Dialog>
  );
}
