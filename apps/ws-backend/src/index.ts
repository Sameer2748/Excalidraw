import { WebSocket, WebSocketServer } from "ws";
import jwt, { decode, JwtPayload } from "jsonwebtoken";
const { JWT_SECRET } = require("@repo/backend-common/config");
const client = require("@repo/db/client");

// create a websocket server
const wss = new WebSocketServer({ port: 8082 });

interface Users {
  userId: string;
  rooms: string[];
  ws: WebSocket;
}

const users: Users[] = [];

const broadcastToRoom = async (
  roomId: string,
  message: string,
  ws: WebSocket,
  userId: string
) => {
  //TODO: add a queue like redis for no error and optimization

  //store the chat in the backend
  await client.chat.create({
    data: {
      userId: userId,
      message,
      roomId: parseInt(roomId),
    },
  });

  // broadcast to every user
  const allusers = users.filter((user) => user.ws !== ws);
  allusers.forEach((user) => {
    if (user.rooms.includes(roomId)) {
      user.ws.send(JSON.stringify({ type: "chat", message, roomId }));
    }
  });
};

const checkUser = (token: string): string | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (typeof decoded === "string") {
      return null;
    }

    if (!decoded || !decoded.userId) return null;

    return decoded.userId;
  } catch (error) {
    console.error("Invalid token:", error);
    return null;
  }
};

wss.on("connection", (ws, request) => {
  console.log("connwction created");
  const url = request.url;
  if (!url) {
    return;
  }
  const queryparams = new URLSearchParams(url.split("?")[1]);
  const token = queryparams.get("token") || "";
  const userId = checkUser(token);
  if (!userId) {
    ws.close();
    return;
  }

  users.push({
    userId,
    rooms: [],
    ws,
  });

  ws.on("message", async (data) => {
    const parsedData = JSON.parse(data as unknown as string);

    switch (parsedData.type) {
      case "room-join":
        // find user with their websocket connection when try to join some room
        const user = users.find((u) => u.ws === ws);
        user?.rooms.push(parsedData.roomId);

        break;

      case "leave-room":
        const leavinguser = users.find((u) => u.ws === ws);
        console.log(leavinguser);

        if (!leavinguser) return;
        leavinguser.rooms = leavinguser?.rooms.filter(
          (roomId) => roomId !== parsedData.roomId
        );

        console.log(leavinguser.rooms);
        break;

      case "chat":
        broadcastToRoom(parsedData.roomId, parsedData.message, ws, userId);
        break;

      default:
        break;
    }
  });
});
