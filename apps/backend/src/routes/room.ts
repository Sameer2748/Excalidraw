import { Request, Response, Router } from "express";
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
