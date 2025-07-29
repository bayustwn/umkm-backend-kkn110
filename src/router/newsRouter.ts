import { Hono } from "hono";
import { getAllNews, getDetailNews, getOtherNews, getPreviewNews, uploadNews, deleteNews, editNews } from "../controller/newsController";
import { verifyToken } from "../middleware/isLogin";

const news = new Hono();

news.get("/", getAllNews);
news.get("/preview", getPreviewNews);
news.get("/:id", getDetailNews);
news.get("/other/:id",getOtherNews);
news.post('/upload', verifyToken(true),uploadNews)
news.delete('/delete/:id',verifyToken(true), deleteNews)
news.patch('/edit/:id',verifyToken(true), editNews)


export default news;