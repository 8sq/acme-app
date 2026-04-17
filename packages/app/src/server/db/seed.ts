import { resolve } from "node:path";
import { seed } from ".";

await seed(resolve(import.meta.dirname, "seed.sql"));
