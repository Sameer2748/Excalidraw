import { Router } from "express";
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
        take: 50,
      });

      console.log(chats);
      res.json({ message: "got all chats", chats });
    } catch (error) {
      console.error("Error fetching room:", error);
      res.status(500).json({ message: "Error fetching room chats" });
    }
  }
);
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
      res.json({ message: "Created room successfully", roomId: room.id });
    } catch (error) {}
    res.json({ message: "Creating room" });
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
