//src/jobs.dashbord
import { ExpressAdapter } from "@bull-board/express";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { crawlQueue, embedQueue } from "./queues.js";
import express from "express";

export const mountBullBoard = (app: express.Express) => {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath("/admin/queues");

  createBullBoard({
    queues: [new BullMQAdapter(crawlQueue), new BullMQAdapter(embedQueue)],
    serverAdapter,
  });

  app.use("/admin/queues", serverAdapter.getRouter());
};
