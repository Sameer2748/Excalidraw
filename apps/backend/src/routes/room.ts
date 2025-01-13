import { Router } from "express";
import { signInMiddleware } from "../middlewares/signInMiddleware";

export const RoomRoutes: Router = Router();

RoomRoutes.post("/create-room", signInMiddleware, (req: any, res: any) => {
  res.json({ message: "Creating room" });
});
