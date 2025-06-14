import express from "express";
import userRoutes from "./routes/login";
import { RoomRoutes } from "./routes/room";
import { useGenerate } from "./routes/generate";
import cors from "cors";

const app = express();
const port = process.env.PORT || 8083;
app.use(
  cors({
    origin: ["http://localhost:3001", "http://localhost:3000", "https://excalfnt.100xsam.store"], // your frontend URL
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Origin",
      "x-access-token",
    ],
  })
);

// Add OPTIONS handling for preflight requests
app.options("*", cors());

app.use(express.json());

app.get("/", (req, res) => {
  console.log("home");
});

app.use("/api/v1/user", userRoutes);
app.use("/api/v1/room", RoomRoutes);
app.use("/api/v1/ai", useGenerate);
app.listen(port, () => {
  console.log("listening on port " + port);
});
