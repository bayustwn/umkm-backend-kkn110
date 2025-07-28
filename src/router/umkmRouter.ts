import { Hono } from 'hono';
import { getPreviewUmkm, getAllUmkm, getAllUmkmAdmin, getAllCategory, addCategory, deleteCategory, getDetailUmkm, getOtherUmkm, registerUMKM, uploadProduct, updateUMKM, updateProduct, deleteUMKM, approveUMKM } from '../controller/umkmController';

const umkmRouter = new Hono();

umkmRouter.get('/preview', getPreviewUmkm);
umkmRouter.get('/', getAllUmkm);
umkmRouter.get('/category', getAllCategory);
umkmRouter.post('/category', addCategory);
umkmRouter.delete('/category/:id', deleteCategory);
umkmRouter.get('/admin', getAllUmkmAdmin);
umkmRouter.get('/:id', getDetailUmkm);
umkmRouter.get("/other/:id", getOtherUmkm)
umkmRouter.post("/register", registerUMKM)
umkmRouter.post("/product",uploadProduct)
umkmRouter.patch("/product/:id", updateProduct)
umkmRouter.patch("/approve/:id", approveUMKM)
umkmRouter.patch("/:id", updateUMKM)
umkmRouter.delete("/:id",deleteUMKM)

export default umkmRouter;
