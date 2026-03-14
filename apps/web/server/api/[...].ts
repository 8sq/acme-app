import { defineEventHandler } from "nitro/h3";
import app from "@ygoma/api";

export default defineEventHandler(({ req }) => app.fetch(req));
