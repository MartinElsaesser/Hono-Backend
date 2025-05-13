import { serveStatic } from "@hono/node-server/serve-static";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import apiRouter from "./routers/apiRouter.js";
import { envs } from "./config/env.js";

const app = new Hono();

/*   register middleware   */
app.use("/static/*", serveStatic({ root: "./" }));

/*   register routers   */
const apiRoutes = app.route("/api", apiRouter);
app.get("/", (c) => {
  return c.text("Hello World");
});

/*   start up server   */
const port = envs.PORT;
console.log(`Server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});

export type ApiRoutes = typeof apiRoutes;
