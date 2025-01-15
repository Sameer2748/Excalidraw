import { WebSocketServer } from "ws";
import jwt, { decode, JwtPayload } from "jsonwebtoken";
const { JWT_SECRET } = require("@repo/backend-common/config");

// create a websocket server
const wss = new WebSocketServer({ port: 8081 });

wss.on("connection", (ws, request) => {
  console.log("connwction created");
  const url = request.url;
  if (!url) {
    return;
  }
  const queryparams = new URLSearchParams(url.split("?")[1]);
  const token = queryparams.get("token") || "";
  const decoded = jwt.verify(token, JWT_SECRET);

  if (!(decoded as JwtPayload).userId || !decoded) {
    ws.close();
    return;
  }
  ws.on("message", (data) => {
    console.log("received message:", data);
    ws.send("pong");
  });
});
