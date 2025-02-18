import { Response, Router } from "express";
const client = require("@repo/db/client");

import run from "../ai";
import { signInMiddleware } from "../middlewares/signInMiddleware";

const router: Router = Router();

router.post(
  "/generate-diagram",
  signInMiddleware,
  async (req: any, res: Response) => {
    try {
      const prompt = req.body.prompt;
      console.log("Prompt: ", prompt);
      if (!prompt) {
        res.status(400).json({ message: "Invalid prompt" });
        return;
      }

      const ai_response = await run(prompt);
      console.log("Ai response: \n", ai_response);
      const response = ai_response
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .replace(/\n/g, "")
        .trim();
      res.status(200).json({ message: "Diagram Generated", response });
    } catch (error) {
      res.status(500).json({ message: "Error Generating Diagram" });
    }
  }
);

router.post(
  "/diagram-to-canvas",
  signInMiddleware,
  async (req: any, res: Response) => {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const diagram = req.body.diagram;
      let roomId = req.body.roomId;
      console.log("Debug - roomId before processing:", roomId, typeof roomId);

      if (!diagram) {
        res.status(400).json({ message: "Invalid diagram" });
        return;
      }

      if (!roomId) {
        res.status(400).json({ message: "Invalid roomId" });
        return;
      }

      // Handle roomId properly based on its structure
      // If it's already a number, use it directly
      // If it's an object with an id property, use that
      // If it's a string, parse it to integer
      const roomIdValue =
        typeof roomId === "object" && roomId.id
          ? parseInt(roomId.id)
          : typeof roomId === "string"
            ? parseInt(roomId)
            : roomId;

      console.log("Debug - processed roomIdValue:", roomIdValue);

      const createPromises = diagram.map((shape: any) => {
        return client.chat.create({
          data: {
            message: JSON.stringify(shape),
            user: {
              connect: {
                id: userId,
              },
            },
            room: {
              connect: {
                id: roomIdValue,
              },
            },
          },
        });
      });

      await Promise.all(createPromises);

      res.status(200).json({ message: "Diagram saved to canvas" });
    } catch (error) {
      console.error("Error pushing to canvas:", error);
      res.status(500).json({
        message: "Error pushing to canvas",
        details: error,
      });
    }
  }
);

export const useGenerate: Router = router;
