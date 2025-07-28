import { Hono } from "hono";
import { login, getUserInfo, updateUser } from "../controller/userController";
import { verifyToken } from "../middleware/isLogin";

const userRouter = new Hono()

userRouter.post("/login", login)
userRouter.get("/info", getUserInfo)
userRouter.put("/update", verifyToken(true), updateUser)

export default userRouter;