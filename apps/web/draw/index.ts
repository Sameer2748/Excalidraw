// draw.ts
import axios from "axios";
import { Backend_url } from "../app/config";
import { WebSocketService } from "../hooks/WebSocketService";

type Point = {
  x: number;
  y: number;
};

type Shape =
  | {
      type: "Rect";
      x: number;
      y: number;
      width: number;
      height: number;
      color?: string;
      border?: number;
      style?: string;
    }
  | {
      type: "Circle";
      centerX: number;
      centerY: number;
      radius: number;
      color?: string;
      border?: number;
      style?: string;
    }
  | {
      type: "Line";
      startX: number;
      startY: number;
      endX: number;
      endY: number;
      color?: string;
      border?: number;
      style?: string;
    }
  | {
      type: "DiagonalRect";
      centerX: number;
      centerY: number;
      width: number;
      height: number;
      angle: number;
      color?: string;
      border?: number;
      style?: string;
    }
  | {
      type: "RegularPolygon";
      centerX: number;
      centerY: number;
      sideLength: number;
      rotation: number;
      color?: string;
      border?: number;
      style?: string;
    }
  | {
      type: "Input";
      x: number;
      y: number;
      text: string;
      fontSize: number;
      color?: string;
    }
  | {
      type: "editedText";
      originalX: number;
      originalY: number;
      newX: number;
      newY: number;
      text: string;
      fontSize: number;
      color?: string;
    };

export function initDraw(
  canvas: HTMLCanvasElement,
  RoomId: string,
  wsService: WebSocketService
) {
  let currentShape = "Rect";
  let currentColor = "white";
  let currentBorder = 1;
  let currentStyle = "normal";
  let clicked = false;
  let startX = 0;
  let startY = 0;
  let Shapes: Shape[] = [];
  const ctx = canvas.getContext("2d");

  // Text input state
  let textInputActive = false;
  let activeText: {
    x: number;
    y: number;
    content: string;
    original?: Shape;
  } | null = null;
  let cursorVisible = false;
  let cursorInterval: NodeJS.Timeout;
  const FONT_SIZE = 16;

  if (!ctx) return { cleanup: () => {}, setCurrentShape: () => {} };

  const container = canvas.parentElement;
  if (!container) return { cleanup: () => {}, setCurrentShape: () => {} };

  // Text input handling

  const startTextInput = (
    x: number,
    y: number,
    existingShape?: Extract<Shape, { type: "Input" }>
  ) => {
    textInputActive = true;
    activeText = {
      x: existingShape ? existingShape.x : x,
      y: existingShape ? existingShape.y : y,
      content: existingShape ? existingShape.text : "",
      original: existingShape,
    };

    cursorInterval = setInterval(() => {
      cursorVisible = !cursorVisible;
      drawCanvas();
    }, 500);
    canvas.focus();
  };

  const finishTextInput = () => {
    if (activeText && activeText.content.trim()) {
      if (activeText.original) {
        // Create editedText shape with original position
        const editedShape: Shape = {
          type: "editedText",
          originalX: activeText.original.x,
          originalY: activeText.original.y,
          newX: activeText.x,
          newY: activeText.y,
          text: activeText.content,
          fontSize: FONT_SIZE,
          color: activeText.original.color || currentColor,
        };

        wsService.send({
          type: "chat",
          roomId: RoomId,
          message: JSON.stringify(editedShape),
        });

        // Update local copy
        const index = Shapes.indexOf(activeText.original);
        if (index !== -1) {
          Shapes.splice(index, 1, {
            type: "Input",
            x: activeText.x,
            y: activeText.y,
            text: activeText.content,
            fontSize: FONT_SIZE,
            color: activeText.original.color,
          });
        }
      } else {
        // Send new text as normal Input shape
        const newShape: Shape = {
          type: "Input",
          x: activeText.x,
          y: activeText.y,
          text: activeText.content,
          fontSize: FONT_SIZE,
          color: currentColor,
        };
        wsService.send({
          type: "chat",
          roomId: RoomId,
          message: JSON.stringify(newShape),
        });
        Shapes.push(newShape);
      }

      drawCanvas();
    }

    textInputActive = false;
    activeText = null;
    clearInterval(cursorInterval);
  };
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!textInputActive || !activeText) return;

    switch (e.key) {
      case "Enter":
      case "Escape":
        finishTextInput();
        break;
      case "Backspace":
        activeText.content = activeText.content.slice(0, -1);
        drawCanvas();
        break;
      case " ":
        // Prevent scrolling when pressing space
        e.preventDefault();
        activeText.content += " ";
        drawCanvas();
        break;
      default:
        if (e.key.length === 1) {
          activeText.content += e.key;
          drawCanvas();
        }
    }
  };

  const getTextBounds = (text: string, x: number, y: number) => {
    ctx.save();
    ctx.font = `${FONT_SIZE}px Arial`;
    const metrics = ctx.measureText(text);
    ctx.restore();
    return {
      x: x,
      y: y - FONT_SIZE,
      width: metrics.width,
      height: FONT_SIZE * 1.2,
    };
  };

  const handleClick = (e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Handle text submission when clicking outside active text
    if (textInputActive && activeText) {
      const bounds = getTextBounds(
        activeText.content,
        activeText.x,
        activeText.y
      );
      if (
        !(
          x >= bounds.x &&
          x <= bounds.x + bounds.width &&
          y >= bounds.y &&
          y <= bounds.y + bounds.height
        )
      ) {
        finishTextInput();
        return;
      }
    }

    if (currentShape === "Input") {
      // Check for existing text
      const clickedText = Shapes.find(
        (shape): shape is Extract<Shape, { type: "Input" }> => {
          if (shape.type !== "Input") return false;
          const bounds = getTextBounds(shape.text, shape.x, shape.y);
          return (
            x >= bounds.x &&
            x <= bounds.x + bounds.width &&
            y >= bounds.y &&
            y <= bounds.y + bounds.height
          );
        }
      );

      if (clickedText) {
        startTextInput(x, y, clickedText);
        return;
      }

      startTextInput(x, y);
      return;
    }

    // Existing drawing logic
    if (textInputActive) return;

    clicked = true;
    startX = x;
    startY = y;
  };

  const mouseupHandler = (e: MouseEvent) => {
    if (textInputActive || currentShape === "Input") return;
    if (!clicked) return;
    clicked = false;

    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    let shape: Shape;
    if (currentShape === "Rect") {
      shape = {
        type: "Rect",
        x: startX,
        y: startY,
        width: currentX - startX,
        height: currentY - startY,
        border: currentBorder,
        color: currentColor,
        style: currentStyle,
      };
    } else if (currentShape === "Circle") {
      shape = {
        type: "Circle",
        centerX: startX,
        centerY: startY,
        radius: Math.hypot(currentX - startX, currentY - startY),
        border: currentBorder,
        color: currentColor,
        style: currentStyle,
      };
    } else if (currentShape === "Line") {
      shape = {
        type: "Line",
        startX: startX,
        startY: startY,
        endX: currentX,
        endY: currentY,
        border: currentBorder,
        color: currentColor,
        style: currentStyle,
      };
    } else if (currentShape === "DiagonalRect") {
      shape = {
        type: "DiagonalRect",
        centerX: startX,
        centerY: startY,
        width: Math.hypot(currentX - startX, currentY - startY),
        height: 100,
        angle: Math.atan2(currentY - startY, currentX - startX),
        border: currentBorder,
        color: currentColor,
        style: currentStyle,
      };
    } else if (currentShape === "RegularPolygon") {
      shape = {
        type: "RegularPolygon",
        centerX: startX,
        centerY: startY,
        sideLength: Math.hypot(currentX - startX, currentY - startY),
        rotation: Math.atan2(currentY - startY, currentX - startX),
        border: currentBorder,
        color: currentColor,
        style: currentStyle,
      };
    } else {
      return;
    }

    Shapes.push(shape);
    wsService.send({
      type: "chat",
      roomId: RoomId,
      message: JSON.stringify(shape),
    });
    drawCanvas();
  };

  const mousemoveHandler = (e: MouseEvent) => {
    if (!clicked || textInputActive || currentShape === "Input") return;

    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    drawCanvas();
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentBorder;
    ctx.setLineDash(getDashPattern());

    if (currentShape === "Rect") {
      ctx.strokeRect(startX, startY, currentX - startX, currentY - startY);
    } else if (currentShape === "Circle") {
      ctx.beginPath();
      ctx.arc(
        startX,
        startY,
        Math.hypot(currentX - startX, currentY - startY),
        0,
        Math.PI * 2
      );
      ctx.stroke();
    } else if (currentShape === "Line") {
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(currentX, currentY);
      ctx.stroke();
      drawArrowhead(ctx, startX, startY, currentX, currentY);
    } else if (currentShape === "DiagonalRect") {
      ctx.save();
      ctx.translate(startX, startY);
      ctx.rotate(Math.atan2(currentY - startY, currentX - startX));
      ctx.strokeRect(
        0,
        -50,
        Math.hypot(currentX - startX, currentY - startY),
        100
      );
      ctx.restore();
    } else if (currentShape === "RegularPolygon") {
      const points = calculateRegularPolygonPoints(
        startX,
        startY,
        Math.hypot(currentX - startX, currentY - startY),
        Math.atan2(currentY - startY, currentX - startX)
      );
      ctx.beginPath();
      points.forEach((p, i) =>
        i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)
      );
      ctx.closePath();
      ctx.stroke();
    }
  };

  const messageHandler = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === "chat") {
        const shape: Shape = JSON.parse(data.message);

        if (shape.type === "editedText") {
          // Find and update existing text
          const originalIndex = Shapes.findIndex(
            (s) =>
              s.type === "Input" &&
              s.x === shape.originalX &&
              s.y === shape.originalY
          );

          if (originalIndex !== -1) {
            Shapes[originalIndex] = {
              type: "Input",
              x: shape.newX,
              y: shape.newY,
              text: shape.text,
              fontSize: shape.fontSize,
              color: shape.color,
            };
          }
        } else if (
          !Shapes.some((s) => JSON.stringify(s) === JSON.stringify(shape))
        ) {
          Shapes.push(shape);
        }

        drawCanvas();
      }
    } catch (error) {
      console.error("Error handling message:", error);
    }
  };

  const getDashPattern = () => {
    switch (currentStyle) {
      case "medium":
        return [5, 5];
      case "large":
        return [10, 5];
      default:
        return [];
    }
  };

  const drawCanvas = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    Shapes.forEach((shape) => {
      ctx.strokeStyle = shape.color || "white";
      ctx.fillStyle = shape.color || "white";
      ctx.lineWidth = (shape as any).border || 1;
      ctx.setLineDash(getStyleDash((shape as any).style || "normal"));

      switch (shape.type) {
        case "Rect":
          ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
          break;
        case "Circle":
          ctx.beginPath();
          ctx.arc(shape.centerX, shape.centerY, shape.radius, 0, Math.PI * 2);
          ctx.stroke();
          break;
        case "Line":
          ctx.beginPath();
          ctx.moveTo(shape.startX, shape.startY);
          ctx.lineTo(shape.endX, shape.endY);
          ctx.stroke();
          drawArrowhead(
            ctx,
            shape.startX,
            shape.startY,
            shape.endX,
            shape.endY
          );
          break;
        case "DiagonalRect":
          ctx.save();
          ctx.translate(shape.centerX, shape.centerY);
          ctx.rotate(shape.angle);
          ctx.strokeRect(0, -shape.height / 2, shape.width, shape.height);
          ctx.restore();
          break;
        case "RegularPolygon":
          const points = calculateRegularPolygonPoints(
            shape.centerX,
            shape.centerY,
            shape.sideLength,
            shape.rotation
          );
          ctx.beginPath();
          points.forEach((p, i) =>
            i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)
          );
          ctx.closePath();
          ctx.stroke();
          break;
        case "Input":
          ctx.font = `${shape.fontSize}px Arial`;
          ctx.fillText(shape.text, shape.x, shape.y);
          break;
      }
    });

    // Draw active text input
    if (textInputActive && activeText) {
      ctx.font = `${FONT_SIZE}px Arial`;
      ctx.fillStyle = activeText.original?.color || currentColor;
      ctx.fillText(activeText.content, activeText.x, activeText.y);

      // Draw cursor
      if (cursorVisible) {
        const metrics = ctx.measureText(activeText.content);
        ctx.beginPath();
        ctx.moveTo(activeText.x + metrics.width, activeText.y - FONT_SIZE);
        ctx.lineTo(activeText.x + metrics.width, activeText.y);
        ctx.strokeStyle = "white";
        ctx.stroke();
      }
    }
  };

  const getStyleDash = (style: string): number[] => {
    switch (style) {
      case "medium":
        return [5, 5];
      case "large":
        return [10, 5];
      default:
        return [];
    }
  };

  canvas.addEventListener("mousedown", handleClick);
  canvas.addEventListener("mouseup", mouseupHandler);
  canvas.addEventListener("mousemove", mousemoveHandler);
  canvas.addEventListener("keydown", handleKeyDown);
  wsService.addMessageHandler(messageHandler);
  canvas.tabIndex = 0;

  // Load initial shapes
  axios
    .get(`${Backend_url}/room/chats/${RoomId}`, {
      headers: { Authorization: `${localStorage.getItem("token")}` },
    })
    .then((res) => {
      try {
        Shapes = res.data.chats.map((x: { message: string }) =>
          JSON.parse(x.message)
        );
        drawCanvas();
      } catch (error) {
        console.error("Error loading initial shapes:", error);
      }
    });

  // Initial draw
  drawCanvas();

  return {
    setCurrentShape: (newShape: string) => (currentShape = newShape),
    setCurrentColor: (newColor: string) => (currentColor = newColor),
    setCurrentWidth: (newWidth: number) => (currentBorder = newWidth),
    setCurrentStyle: (newStyle: string) => (currentStyle = newStyle),
    cleanup: () => {
      canvas.removeEventListener("mousedown", handleClick);
      canvas.removeEventListener("mouseup", mouseupHandler);
      canvas.removeEventListener("mousemove", mousemoveHandler);
      canvas.removeEventListener("keydown", handleKeyDown);
      wsService.removeMessageHandler(messageHandler);
      if (cursorInterval) clearInterval(cursorInterval);
    },
  };
}

function calculateRegularPolygonPoints(
  centerX: number,
  centerY: number,
  sideLength: number,
  rotation: number
): Point[] {
  const points: Point[] = [];
  const sides = 6;
  const radius = sideLength / (2 * Math.sin(Math.PI / sides));

  for (let i = 0; i < sides; i++) {
    const angle = rotation + (i * 2 * Math.PI) / sides;
    points.push({
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    });
  }
  return points;
}

function drawArrowhead(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  endX: number,
  endY: number
) {
  const angle = Math.atan2(endY - startY, endX - startX);
  const headLength = 10;

  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(
    endX - headLength * Math.cos(angle - Math.PI / 6),
    endY - headLength * Math.sin(angle - Math.PI / 6)
  );
  ctx.moveTo(endX, endY);
  ctx.lineTo(
    endX - headLength * Math.cos(angle + Math.PI / 6),
    endY - headLength * Math.sin(angle + Math.PI / 6)
  );
  ctx.stroke();
}
