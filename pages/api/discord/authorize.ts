import { NextApiRequest, NextApiResponse } from "next";

import { ApiRequest } from "../../../lib/apiUtils";
import { authorizeURL } from "../../../lib/discord";

export default (req: ApiRequest, res: NextApiResponse) => {
  res.writeHead(302, {
    Location: authorizeURL,
  });
  res.end();
};
