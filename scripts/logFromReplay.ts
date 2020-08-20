import * as path from "https://deno.land/std/path/mod.ts";

import { Application, Router, Status } from "https://deno.land/x/oak/mod.ts";

import { exec } from "https://deno.land/x/exec/mod.ts";

const app = new Application();
const port: number = 8080;

const router = new Router();

router.get("/", ({ response }) => {
  response.body = "Ok";
});

router.post("/", async (context) => {
  const { request, response } = context;
  const body = request.body({ type: "form-data" });
  const formData = await body.value.read();
  const file = formData.files?.[0];

  if (!file || path.extname(file.originalName).toLowerCase() !== ".wagame") {
    return context.throw(Status.BadRequest, "Please supply a .WAgame");
  }

  if (!file.filename) {
    return context.throw(500);
  }

  const replayFilename = file.filename.replace(
    path.extname(file.filename),
    ".WAgame",
  );
  const logFilename = file.filename.replace(
    path.extname(file.filename),
    ".log",
  );
  await Deno.rename(file.filename, replayFilename);

  await exec(
    `wine wa/WA.exe /q /getlog ${replayFilename}`,
  );

  response.body = await Deno.readTextFile(logFilename);
});

app.use(router.routes());
app.use(router.allowedMethods());

console.log("running on port ", port);
await app.listen({ port });
