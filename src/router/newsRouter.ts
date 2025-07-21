import { Hono } from "hono";
import { getAllNews, getDetailNews, getOtherNews, getPreviewNews } from "../controller/newsController";

const news = new Hono();

news.get("/", getAllNews);
news.get("/preview", getPreviewNews);
news.get("/:id", getDetailNews);
news.get("/other/:id",getOtherNews);


export default news;