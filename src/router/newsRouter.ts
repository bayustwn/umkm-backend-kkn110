import { Hono } from "hono";
import { getAllNews, getDetailNews, getOtherNews, getPreviewNews, uploadNews, deleteNews, editNews } from "../controller/newsController";

const news = new Hono();

news.get("/", getAllNews);
news.get("/preview", getPreviewNews);
news.get("/:id", getDetailNews);
news.get("/other/:id",getOtherNews);
news.post('/upload', uploadNews)
news.delete('/delete/:id', deleteNews)
news.patch('/edit/:id', editNews)


export default news;