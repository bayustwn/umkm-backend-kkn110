import { Hono } from "hono";
import { getDashboard } from "../controller/dashboardController";

const dashboardRouter = new Hono()

dashboardRouter.get("/", getDashboard)

export default dashboardRouter;