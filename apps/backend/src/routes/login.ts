import express, { Router } from "express";
const { JWT_SECRET } = require("@repo/backend-common/config");

const { CreateUserSchema } = require("@repo/common/types");
const client = require("@repo/db/client");
import jwt from "jsonwebtoken";
import { signInMiddleware } from "../middlewares/signInMiddleware";

const userRoutes: Router = Router();

// Define your routes

userRoutes.post("/signUp", async (req: any, res: any) => {
  const { username, email, password } = req.body;
  const parsedData = CreateUserSchema.safeParse(req.body);
  console.log(req.body);

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
    console.log("User created successfully:", user);
    res.json({ message: "signed up successfully", userId: user.id });
  } catch (error: any) {
    console.error("Error creating user:", error);
    if (error.code === "P2002") {
      res.status(400).json({ message: "Email already exists" });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }

  // db call
});

userRoutes.post("/signIn", async (req: any, res: any) => {
  const { email, password } = req.body;
  console.log(req.body);

  try {
    const user = await client.user.findUnique({
      where: {
        email,
      },
    });
    console.log(user);

    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const userId = user.id;
    const token = jwt.sign({ userId }, JWT_SECRET);

    res.json({ token });
  } catch (error) {}
});

userRoutes.get("/", signInMiddleware, async (req, res) => {
  const userId = req.userId;
  console.log(userId);

  try {
    const user = await client.user.findUnique({
      where: { id: userId },
    });
    console.log(user);

    res.json({ message: "User fetched successfully", user });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Error fetching user" });
  }
});

export default userRoutes;
