import * as React from "react";
import Page from "../components/Page";
import withApollo from "../lib/withApollo";

function Report() {
  const [replayFile, setReplayFile] = React.useState<File>();
  const [details, setDetails] = React.useState(null);
  const [submitting, setSubmitting] = React.useState(false);
  return (
    <Page>
      {details ? (
        <pre style={{ fontSize: "small" }}>{details}</pre>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();

            const formData = new FormData();
            formData.append("replay", replayFile);

            setSubmitting(true);
            const res = await fetch("/api/replay", {
              method: "POST",
              body: formData,
            });
            const text = await res.text();
            setDetails(text);
          }}
        >
          <input
            type="file"
            accept=".WAgame"
            disabled={submitting}
            onChange={(e) => {
              setReplayFile(e.target.files?.[0]);
            }}
          />
          <br />
          <button disabled={submitting}>Submit</button>
        </form>
      )}
    </Page>
  );
}

export default withApollo(Report);
