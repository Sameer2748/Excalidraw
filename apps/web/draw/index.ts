// draw.ts
import axios from "axios";
import { Backend_url } from "../app/config";

type Shape =
  | {
      type: "Rect";
      x: number;
      y: number;
      width: number;
      height: number;
    }
  | {
      type: "Circle";
      centerX: number;
      centerY: number;
      radius: number;
    };

export async function initDraw(
  canvas: HTMLCanvasElement,
  currentShape: string,
  RoomId: string,
  socket: WebSocket
) {
  const ctx = canvas.getContext("2d");
  const Shapes: Shape[] = await getRoomShapes(RoomId);
  console.log(Shapes);

  if (!ctx) {
    return;
  }

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "chat") {
      const parsedData = JSON.parse(data.message);
      console.log(parsedData);
      Shapes.push(parsedData);
      clearCanvas(Shapes, canvas, ctx);
    }
  };

  clearCanvas(Shapes, canvas, ctx);

  let clicked = false;
  let startX = 0;
  let startY = 0;

  canvas.addEventListener("mousedown", (e) => {
    clicked = true;
    startX = e.clientX;
    startY = e.clientY;
  });

  canvas.addEventListener("mouseup", (e) => {
    clicked = false;
    const width = e.clientX - startX;
    const height = e.clientY - startY;

    let shape: Shape;

    if (currentShape === "Rect") {
      shape = {
        type: "Rect",
        x: startX,
        y: startY,
        width,
        height,
      };
    } else {
      // For circle, use distance from start to current as radius
      const radius = Math.sqrt(width * width + height * height);
      shape = {
        type: "Circle",
        centerX: startX,
        centerY: startY,
        radius,
      };
    }

    Shapes.push(shape);
    socket.send(
      JSON.stringify({
        type: "chat",
        roomId: RoomId,
        message: JSON.stringify(shape),
      })
    );
  });

  canvas.addEventListener("mousemove", (e) => {
    if (clicked) {
      const width = e.clientX - startX;
      const height = e.clientY - startY;

      clearCanvas(Shapes, canvas, ctx);
      ctx.strokeStyle = "rgb(255,255,255)";

      if (currentShape === "Rect") {
        ctx?.strokeRect(startX, startY, width, height);
      } else if (currentShape === "Circle") {
        const radius = Math.sqrt(width * width + height * height);
        ctx.beginPath();
        ctx.arc(startX, startY, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  });
}

function clearCanvas(
  existingShapes: Shape[],
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D
) {
  ctx?.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(0,0,0)";
  ctx?.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgb(255,255,255)";

  // Draw all existing shapes
  existingShapes.forEach((shape) => {
    if (shape.type === "Rect") {
      ctx?.strokeRect(shape.x, shape.y, shape.width, shape.height);
    } else if (shape.type === "Circle") {
      ctx.beginPath();
      ctx.arc(shape.centerX, shape.centerY, shape.radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  });
}

async function getRoomShapes(RoomId: string) {
  const res = await axios.get(`${Backend_url}/room/chats/${RoomId}`, {
    headers: {
      Authorization: `${localStorage.getItem("token")}`,
    },
  });
  const data = res.data.chats;
  const shapes = data.map((x: { message: string }) => {
    return JSON.parse(x.message);
  });

  return shapes;
}
