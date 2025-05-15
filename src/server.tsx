import { serveStatic } from "@hono/node-server/serve-static";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import apiRouter from "./routers/apiRouter.js";
import { envs } from "./config/env.js";
import { cors } from "hono/cors";
import {setTimeout} from "node:timers/promises"

const app = new Hono();

/*   register middleware   */
app.use(cors({origin: "*"}));
app.use("/static/*", serveStatic({ root: "./" }));
app.use(async (c, next) => {
  await setTimeout(2*1000)
  return await next();
})

/*   register routers   */
const apiRoutes = app.route("/api", apiRouter);
app.get("/", (c) => {
  return c.text("Hello World");
});

/*   start up server   */
const port = envs.PORT;

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);

export type ApiRoutes = typeof apiRoutes;
