import * as fs from "fs";

import { parseGameLog } from "../lib/wa";

const log = fs.readFileSync(0).toString();
console.log(parseGameLog(log));
