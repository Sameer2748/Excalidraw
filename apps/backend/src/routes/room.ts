import { Request, Response, Router } from "express";
import { RequestHandler } from "express";
import { signInMiddleware } from "../middlewares/signInMiddleware";
const { RoomSchema } = require("@repo/common/types");
const client = require("@repo/db/client");
export const RoomRoutes: Router = Router();

RoomRoutes.get(
  "/chats/:roomId",
  signInMiddleware,
  async (req: any, res: any) => {
    const roomId = req.params.roomId;
    try {
      // find chats for that room id in chats
      // replace `client.chat.find` with actual query to fetch chats from the database using the roomId
      // const chats = await client.chat.find({ where: { roomId } });
      const chats = await client.chat.findMany({
        where: { roomId: parseInt(roomId) },
        orderBy: { createdAt: "desc" },
      });

      console.log(chats);
      res.json({ message: "got all chats", chats });
    } catch (error) {
      console.error("Error fetching room:", error);
      res.status(500).json({ message: "Error fetching room chats" });
    }
  }
);

RoomRoutes.delete("/:id", signInMiddleware, async (req: any, res: any) => {
  const userId = req.userId;
  const id = req.params.id;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    // Use transaction for atomicity
    const transaction = await client.$transaction(async (client: any) => {
      await client.chat.deleteMany({
        where: { roomId: parseInt(id) },
      });

      // Delete the room
      await client.room.delete({
        where: { id: parseInt(id) },
      });
    });

    res.status(200).json({ message: "Room deleted successfully" });
  } catch (error) {
    console.error("Error in deleting the room:", error);
    res.status(500).json({ message: "Error in deleting the room", error });
  }
});

RoomRoutes.post(
  "/create-room",
  signInMiddleware,
  async (req: any, res: any) => {
    const { roomName } = req.body;
    try {
      const slug = roomName
        .toLowerCase()
        .replace(/ /g, "-")
        .replace(/[^a-z0-9-]/g, "");

      const room = await client.room.create({
        data: {
          Slug: slug,
          adminId: req.userId,
        },
      });
      console.log("Room created successfully:", room);
      res.json({ message: "Created room successfully", room });
    } catch (error) {
      res.status(401).json({ message: "error in Creating room" });
    }
  }
);

RoomRoutes.get("/:slug", async (req, res) => {
  const slug = req.params.slug;
  console.log(slug);

  await client.room
    .findUnique({
      where: { Slug: slug },
    })
    .then((room: any) => {
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      res.json({ message: "Room found", room });
    })
    .catch((error: any) => {
      console.error("Error fetching room:", error);
      res.status(500).json({ message: "Error fetching room" });
    });
});

RoomRoutes.get("/", signInMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const rooms = await client.room.findMany({ where: { adminId: userId } });
    console.log(rooms);

    res.json({ message: "room got succesfuuly", rooms });
  } catch (error) {
    console.error("Error fetching room:", error);
    res.status(500).json({ message: "Error fetching room" });
  }
});

RoomRoutes.put(
  "/update-shape/:shapeId",
  signInMiddleware,
  async (req: any, res: any) => {
    const { shapeId } = req.params;
    const shapeData = req.body;

    try {
      // Update shape in the database
      const updatedShape = await client.chat.update({
        where: { id: parseInt(shapeId) },
        data: {
          message: JSON.stringify(shapeData),
        },
      });

      res.json({
        message: "Shape updated successfully",
        shape: updatedShape,
      });
    } catch (error) {
      console.error("Error updating shape:", error);
      res.status(500).json({ message: "Error updating shape" });
    }
  }
);

RoomRoutes.post("/:roomId/shape", signInMiddleware, async (req, res) => {
  try {
    const { roomId }: any = req.params;
    const { message } = req.body;
    const userId = req.userId; // From your auth middleware

    const newShape = await client.chat.create({
      data: {
        userId,
        message,
        roomId: parseInt(roomId),
      },
    });

    res.json({ id: newShape.id });
  } catch (error) {
    console.error("Error creating shape:", error);
    res.status(500).json({ error: "Failed to create shape" });
  }
});

// Delete shape route
const deleteShape: RequestHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const shapeId: any = req.params.shapeId;
  const roomId: any = req.params.roomId;

  try {
    const parsedShapeId = parseInt(shapeId);

    const shape = await client.chat.findFirst({
      where: {
        id: parsedShapeId,
        roomId: parseInt(roomId),
      },
    });

    if (!shape) {
      res.status(404).json({
        message: "Shape not found or does not belong to this room",
      });
      return;
    }

    const deletedShape = await client.chat.delete({
      where: { id: parsedShapeId },
    });

    res.json({
      message: "Shape deleted successfully",
      data: deletedShape,
    });
    return;
  } catch (error) {
    console.error("Error deleting shape:", error);
    res.status(500).json({
      message: "Error deleting the shape",
      error: error,
    });
    return;
  }
};

RoomRoutes.post("/:roomId/:shapeId", signInMiddleware, deleteShape);
