import * as path from "https://deno.land/std/path/mod.ts";

import {
  Application,
  Status,
  isHttpError,
} from "https://deno.land/x/oak/mod.ts";

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

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    console.log(err);
    if (isHttpError(err)) {
      switch (err.status) {
        case Status.NotFound:
          // handle NotFound
          break;
        default:
          // handle other statuses
      }
    } else {
      // rethrow if you can't handle the error
      throw err;
    }
  }
});

app.use(async (context) => {
  const { request, response } = context;
  const body = request.body({ type: "form-data" });

  console.log("Reading form data...");
  const formData = await body.value.read();
  const file = formData.files?.[0];

  if (!file || path.extname(file.originalName).toLowerCase() !== ".wagame") {
    return context.throw(Status.BadRequest, "Please supply a .WAgame");
  }

  console.log("Supplied a WAgame...");

  if (!file.filename) {
    return context.throw(500);
  }

  console.log("File was valid...");

  const replayFilename = file.filename.replace(
    path.extname(file.filename),
    ".WAgame",
  );
  const logFilename = file.filename.replace(
    path.extname(file.filename),
    ".log",
  );
  console.log("Renaming...");
  await Deno.rename(file.filename, replayFilename);
  console.log(`Extracting log from ${replayFilename}`);
  try {
    await exec(
      `bash -c "sudo docker run --rm -i wa wa-getlog < ${replayFilename} > ${logFilename}"`,
    );
    const decoder = new TextDecoder("windows-1252");
    const data = await Deno.readFile(logFilename);
    response.body = decoder.decode(data);
  } catch (error) {
    console.log(error);
    context.throw(error);
  }
});

console.log("Running on port ", port);
await app.listen({ port });
