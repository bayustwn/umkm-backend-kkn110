import { Hono } from 'hono';
import { getPreviewUmkm, getAllUmkm, getAllUmkmAdmin, getAllCategory, addCategory, deleteCategory, getDetailUmkm, getOtherUmkm, registerUMKM, uploadProduct, updateUMKM, updateProduct, deleteUMKM, approveUMKM } from '../controller/umkmController';
import { verifyToken } from '../middleware/isLogin';

const umkmRouter = new Hono();

umkmRouter.get('/preview', getPreviewUmkm);
umkmRouter.get('/', getAllUmkm);
umkmRouter.get('/category', getAllCategory);
umkmRouter.post('/category', verifyToken(true),addCategory);
umkmRouter.delete('/category/:id',verifyToken(true), deleteCategory);
umkmRouter.get('/admin', verifyToken(true),getAllUmkmAdmin);
umkmRouter.get('/:id', getDetailUmkm);
umkmRouter.get("/other/:id", getOtherUmkm)
umkmRouter.post("/register", registerUMKM)
umkmRouter.post("/product",uploadProduct)
umkmRouter.patch("/product/:id", updateProduct)
umkmRouter.patch("/approve/:id",verifyToken(true) ,approveUMKM)
umkmRouter.patch("/:id", verifyToken(true),updateUMKM)
umkmRouter.delete("/:id", verifyToken(true),deleteUMKM)

export default umkmRouter;
