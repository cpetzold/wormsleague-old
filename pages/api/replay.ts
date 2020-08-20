import FormData from "form-data";
import fs from "fs";
import multer from "multer";
import { NextApiResponse } from "next";
import nextConnect from "next-connect";
import fetch from "node-fetch";
import path from "path";
import { ApiRequest } from "../../lib/apiUtils";

type ApiRequestWithFile = ApiRequest & {
  file: Express.Multer.File;
};

const handler = nextConnect();
const upload = multer({ dest: "/tmp" });

handler.use(upload.single("replay"));

handler.post(async (req: ApiRequestWithFile, res: NextApiResponse) => {
  const replayPath = req.file.path.replace(
    path.extname(req.file.path),
    "",
  ) + ".WAgame";

  fs.renameSync(
    req.file.path,
    replayPath,
  );

  const form = new FormData();
  form.append(
    "replay",
    fs.createReadStream(replayPath),
    { filename: req.file.originalname },
  );

  const fetchRes = await fetch(
    "http://34.94.165.86:8080/",
    { method: "POST", body: form },
  );

  const text = await fetchRes.text();
  res.send(text);
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default handler;
