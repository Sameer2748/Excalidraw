// draw.ts
import axios from "axios";
import { Backend_url } from "../app/config";
import { WebSocketService } from "../hooks/WebSocketService";
const { JWT_SECRET } = require("@repo/backend-common/config");
import jwt from "jsonwebtoken";
const client = require("@repo/db/client");

type Point = {
  x: number;
  y: number;
};

type Shape =
  | {
      id?: number;
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
      id?: number;
      type: "Circle";
      centerX: number;
      centerY: number;
      radius: number;
      color?: string;
      border?: number;
      style?: string;
    }
  | {
      id?: number;
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
      id?: number;
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
      id?: number;
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
      id?: number;
      type: "Input";
      x: number;
      y: number;
      text: string;
      fontSize: number;
      color?: string;
    }
  | {
      id?: number;
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
  let currentShape = "";
  let currentColor = "white";
  let currentBorder = 1;
  let currentStyle = "normal";
  let clicked = false;
  let startX = 0;
  let startY = 0;
  let Shapes: Shape[] = [];
  let selectedShape: {
    index: number;
    offsetX: number;
    offsetY: number;
  } | null = null;
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

  // drag and drop
  // Function to check if a point is inside a shape
  const isPointInShape = (x: number, y: number, shape: Shape): boolean => {
    switch (shape.type) {
      case "Rect":
        return (
          x >= shape.x &&
          x <= shape.x + shape.width &&
          y >= shape.y &&
          y <= shape.y + shape.height
        );
      case "Circle":
        const distance = Math.hypot(x - shape.centerX, y - shape.centerY);
        return distance <= shape.radius;
      case "Line":
        // Check if point is close to the line
        const lineDistance = pointToLineDistance(
          x,
          y,
          shape.startX,
          shape.startY,
          shape.endX,
          shape.endY
        );
        return lineDistance <= 5; // 5px threshold
      case "DiagonalRect":
        // Transform point to check against rotated rectangle
        const rotatedPoint = rotatePoint(
          x,
          y,
          shape.centerX,
          shape.centerY,
          -shape.angle
        );
        return (
          rotatedPoint.x >= shape.centerX &&
          rotatedPoint.x <= shape.centerX + shape.width &&
          rotatedPoint.y >= shape.centerY - shape.height / 2 &&
          rotatedPoint.y <= shape.centerY + shape.height / 2
        );
      case "RegularPolygon":
        const points = calculateRegularPolygonPoints(
          shape.centerX,
          shape.centerY,
          shape.sideLength,
          shape.rotation
        );
        return isPointInPolygon(x, y, points);
      case "Input":
        const bounds = getTextBounds(shape.text, shape.x, shape.y);
        return (
          x >= bounds.x &&
          x <= bounds.x + bounds.width &&
          y >= bounds.y &&
          y <= bounds.y + bounds.height
        );
      default:
        return false;
    }
  };

  // Helper function to calculate point to line distance
  const pointToLineDistance = (
    x: number,
    y: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): number => {
    const A = x - x1;
    const B = y - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;
    let xx, yy;
    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }
    return Math.hypot(x - xx, y - yy);
  };

  // Helper function to rotate a point
  const rotatePoint = (
    x: number,
    y: number,
    cx: number,
    cy: number,
    angle: number
  ) => {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const dx = x - cx;
    const dy = y - cy;
    return {
      x: cx + dx * cos - dy * sin,
      y: cy + dx * sin + dy * cos,
    };
  };

  // Helper function to check if point is inside polygon
  const isPointInPolygon = (x: number, y: number, points: Point[]): boolean => {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const xi = points[i].x,
        yi = points[i].y;
      const xj = points[j].x,
        yj = points[j].y;
      const intersect =
        yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  };
  // Helper functions to get offset based on shape type
  const getOffsetX = (clickX: number, shape: Shape): number => {
    switch (shape.type) {
      case "Rect":
        return clickX - shape.x;
      case "Circle":
        return clickX - shape.centerX;
      case "Line":
        return clickX - shape.startX;
      case "DiagonalRect":
      case "RegularPolygon":
        return clickX - shape.centerX;
      case "Input":
        return clickX - shape.x;
      default:
        return 0;
    }
  };

  const getOffsetY = (clickY: number, shape: Shape): number => {
    switch (shape.type) {
      case "Rect":
        return clickY - shape.y;
      case "Circle":
        return clickY - shape.centerY;
      case "Line":
        return clickY - shape.startY;
      case "DiagonalRect":
      case "RegularPolygon":
        return clickY - shape.centerY;
      case "Input":
        return clickY - shape.y;
      default:
        return 0;
    }
  };

  const handleClick = (e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (currentShape === "Hand") {
      // Check if we clicked on any shape
      for (let i = Shapes.length - 1; i >= 0; i--) {
        if (isPointInShape(x, y, Shapes[i])) {
          selectedShape = {
            index: i,
            offsetX: getOffsetX(x, Shapes[i]),
            offsetY: getOffsetY(y, Shapes[i]),
          };
          clicked = true;
          return;
        }
      }
    }

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
  // When updating a shape's position
  const updateShapePosition = (shape: Shape) => {
    wsService.send({
      type: "update-shape",
      roomId: RoomId,
      shapeId: shape.id, // Ensure shape has an ID
      shapeData: shape,
    });
  };

  const mouseupHandler = async (e: MouseEvent) => {
    if (!clicked) return;
    clicked = false;

    // If we're handling text input, return early
    if (textInputActive || currentShape === "Input") return;

    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    // Handle shape dragging
    if (currentShape === "Hand" && selectedShape !== null) {
      // Send updated shape position to server
      wsService.send({
        type: "update-shape",
        roomId: RoomId,
        shapeId: Shapes[selectedShape.index]?.id, // Ensure the shape has an ID
        shapeData: Shapes[selectedShape.index], // Send the entire updated shape
      });
      selectedShape = null;
      return;
    }

    // Handle drawing new shapes
    let shape: Shape | undefined;

    switch (currentShape) {
      case "Rect":
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
        break;
      case "Circle":
        shape = {
          type: "Circle",
          centerX: startX,
          centerY: startY,
          radius: Math.hypot(currentX - startX, currentY - startY),
          border: currentBorder,
          color: currentColor,
          style: currentStyle,
        };
        break;
      case "Line":
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
        break;
      case "DiagonalRect":
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
        break;
      case "RegularPolygon":
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
        break;
    }

    // If a valid shape was created, add it and send to server
    if (shape) {
      // First create the shape in database
      axios
        .post(
          `${Backend_url}/room/${RoomId}/shape`,
          {
            message: JSON.stringify(shape),
          },
          {
            headers: { Authorization: `${localStorage.getItem("token")}` },
          }
        )
        .then((response) => {
          // Add shape with ID to local array
          const shapeWithId = {
            ...shape,
            id: response.data.id, // Assuming response includes the created shape's ID
          };
          Shapes.push(shapeWithId);

          // Then broadcast to other users
          wsService.send({
            type: "chat",
            roomId: RoomId,
            message: JSON.stringify(shapeWithId), // Include the ID in broadcast
          });

          drawCanvas();
        })
        .catch((error) => {
          console.error("Error creating shape:", error);
        });
    }
  };
  const mousemoveHandler = (e: MouseEvent) => {
    if (!clicked || textInputActive || currentShape === "Input") return;

    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    if (currentShape === "Hand" && selectedShape !== null) {
      const shape: Shape = Shapes[selectedShape.index];
      const newX = currentX - selectedShape.offsetX;
      const newY = currentY - selectedShape.offsetY;

      // Update shape position based on type
      switch (shape.type) {
        case "Rect":
          shape.x = newX;
          shape.y = newY;
          break;
        case "Circle":
          shape.centerX = newX;
          shape.centerY = newY;
          break;
        case "Line":
          const dx = newX - shape.startX;
          const dy = newY - shape.startY;
          shape.startX = newX;
          shape.startY = newY;
          shape.endX += dx;
          shape.endY += dy;
          break;
        case "DiagonalRect":
        case "RegularPolygon":
          shape.centerX = newX;
          shape.centerY = newY;
          break;
        case "Input":
          shape.x = newX;
          shape.y = newY;
          break;
      }

      drawCanvas();
      return;
    }

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
      if (data.type === "updated-shape") {
        const shapeIndex = Shapes.findIndex(
          (shape) => shape.id === data.shapeId
        );

        if (shapeIndex !== -1) {
          Shapes[shapeIndex] = {
            ...Shapes[shapeIndex],
            ...data.shape,
          };
          drawCanvas();
        }
      } else if (data.type === "chat") {
        const shape: Shape = JSON.parse(data.message);
        // Only add if shape doesn't exist (checking by ID now)
        if (!Shapes.some((s) => s.id === shape.id)) {
          Shapes.push(shape);
          drawCanvas();
        }
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

  // Modify initial shape loading to preserve IDs
  axios
    .get(`${Backend_url}/room/chats/${RoomId}`, {
      headers: { Authorization: `${localStorage.getItem("token")}` },
    })
    .then((res) => {
      try {
        Shapes = res.data.chats.map((x: { id: number; message: string }) => ({
          ...JSON.parse(x.message),
          id: x.id,
        }));
        drawCanvas();
      } catch (error) {
        console.error("Error loading initial shapes:", error);
      }
    });

  // Initial draw
  drawCanvas();

  return {
    setCurrentShape: (newShape: string) => {
      currentShape = newShape;
      selectedShape = null; // Reset selection when changing tools
    },
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

// adding changing shaped position like pick and drop
