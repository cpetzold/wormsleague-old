import { menubar } from "menubar";
import * as path from "path";

const mb = menubar({
  dir: process.cwd(),
});

mb.on("ready", () => {
  console.log("app is ready");
  // your app code here
});
