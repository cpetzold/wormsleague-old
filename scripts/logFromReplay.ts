import * as path from "https://deno.land/std/path/mod.ts";

import { Application, Status } from "https://deno.land/x/oak/mod.ts";

import { exec } from "https://deno.land/x/exec/mod.ts";

const app = new Application();
const port: number = 8080;

// Logger
app.use(async ({ request, response }, next) => {
  await next();
  const rt = response.headers.get("X-Response-Time");
  console.log(`${request.method} ${request.url} - ${rt}`);
});

// Timing
app.use(async ({ response }, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  response.headers.set("X-Response-Time", `${ms}ms`);
});

app.use(async (context) => {
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

  console.log(`Extracting log from ${replayFilename}`);

  try {
    await exec(
      `bash -c "docker run --rm -i wa wa-getlog < ${replayFilename} > ${logFilename}"`,
    );

    response.body = await Deno.readTextFile(logFilename);
  } catch (error) {
    console.log(error);
    context.throw(error);
  }
});

console.log("Running on port ", port);
await app.listen({ port });
