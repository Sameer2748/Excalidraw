import express, { Router } from "express";
import { JWT_SECRET } from "@repo/backend-common/config";
import { CreateUserSchema } from "@repo/common/types";

const client = require("@repo/db/client");

import jwt from "jsonwebtoken";

const userRoutes: Router = Router();

// Define your routes

userRoutes.post("/signUp", async (req: any, res: any) => {
  const { username, email, password } = req.body;
  const parsedData = CreateUserSchema.safeParse(req.body);

  if (!parsedData.success) {
    return res.status(400).json({ message: "Invalid username or password" });
  }

  try {
    const user = await client.user.create({
      data: {
        username,
        email,
        password,
      },
    });
    console.log(user);
  } catch (error) {}
  // db call
  res.json({ message: "signed up successfully", userId: 1 });
});

userRoutes.post("/signIn", async (req: any, res: any) => {
  const { email, password } = req.body;

  try {
    const user = await client.user.findUnique({
      where: {
        email,
      },
    });
    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const userId = user.id;
    const token = jwt.sign({ userId }, JWT_SECRET);

    res.json({ token });
  } catch (error) {}
});

export default userRoutes;
