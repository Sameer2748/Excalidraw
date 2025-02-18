"use client";
import { useRef, useState } from "react";
import axios from "axios";
import { usePathname } from "next/navigation";
import { CanvasShapeManager } from "../draw/canvasDraw";
import { Backend_url } from "../app/config";

export default function AiModal({
  setAiModal,
}: {
  setAiModal: (s: boolean) => void;
}): React.JSX.Element {
  const pathname = usePathname();

  const roomId = pathname.split("/canvas/")[1];
  const [loading, setLoading] = useState(false);
  const [isInserting, setIsInserting] = useState(false);
  const [shapes, setShapes] = useState([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const promptRef = useRef<HTMLTextAreaElement | null>(null);

  const drawDiagramWithAI = async () => {
    try {
      console.log("Prompt: ", promptRef.current?.value);
      setLoading(true);
      const response = await axios.post(
        `${Backend_url}/ai/generate-diagram`,
        { prompt: promptRef.current?.value },
        {
          headers: {
            Authorization: `${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        const data = JSON.parse(response.data.response);

        drawDiagram(data.shapes);
      }
    } catch (error) {
      console.error("Error generating diagram:", error);
    } finally {
      setLoading(false);
    }
  };

  const drawDiagram = (shapes) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const canvasShapeManager = new CanvasShapeManager(ctx);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    shapes.forEach((shape) => {
      // Convert backend shape format to match frontend Shape type
      const normalizedShape = normalizeShape(shape);
      if (normalizedShape) {
        canvasShapeManager.drawShape(normalizedShape);
      }
    });

    setShapes(shapes);
  };

  // Helper function to normalize shape data
  const normalizeShape = (shape: any): Shape | null => {
    // Convert shape type to lowercase to match frontend types
    const type = shape.type.toLowerCase();

    switch (type) {
      case "rect":
        return {
          type: "rect",
          startX: shape.x, // Map backend 'x' to frontend 'startX'
          startY: shape.y, // Map backend 'y' to frontend 'startY'
          width: shape.width,
          height: shape.height,
          color: shape.color,
          border: shape.border,
          style: shape.style,
        };

      case "circle":
        return {
          type: "circle",
          centerX: shape.centerX,
          centerY: shape.centerY,
          radius: shape.radius,
          color: shape.color,
          border: shape.border,
          style: shape.style,
        };

      case "line":
        return {
          type: "line",
          startX: shape.startX,
          startY: shape.startY,
          endX: shape.endX,
          endY: shape.endY,
          color: shape.color,
          border: shape.border,
          style: shape.style,
        };

      case "input": // Handle 'Input' from backend as 'text' for frontend
        return {
          type: "text",
          startX: shape.x,
          startY: shape.y,
          text: shape.text,
          fontSize: shape.fontSize,
          color: shape.color,
        };

      default:
        console.warn(`Unsupported shape type: ${shape.type}`);
        return null;
    }
  };

  const saveToDB = async () => {
    try {
      setIsInserting(true);
      const response = await axios.post(
        `${Backend_url}/ai/diagram-to-canvas`,
        {
          diagram: shapes,
          roomId: roomId,
        },
        {
          headers: {
            Authorization: `${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        console.log("Response:", response.data);
        setIsInserting(false);
        setAiModal(false);
        window.location.reload();
      }
    } catch (error) {
      console.error("Error pushing to canvas", error);
    }
  };

  return (
    <div
      className="flex items-center justify-center z-[999] bg-[#232329] bg-opacity-20 backdrop-blur-md w-screen h-screen"
      onClick={(e) => {
        if (e.currentTarget === e.target) {
          setAiModal(false);
        }
      }}
    >
      <div className="flex p-9 m-2 bg-gradient-to-br from-neutral-950 to-neutral-900 border border-amethyst-500/45 rounded-xl w-full max-w-7xl h-full max-h-[80vh]">
        {/* Left Column */}
        <div className="flex flex-col w-1/2 pr-4">
          {/* <Logo /> */}
          <h1 className="text-2xl font-semibold text-amethyst-200">
            Generate with AI
          </h1>
          <p className="text-gray-400 text-start text-sm mb-6">
            Enter a prompt and generate a diagram with AI!
          </p>

          <div className="relative mb-4">
            <textarea
              ref={promptRef}
              placeholder="E.g. Draw a flow chart for authentication or a diagram of a system architecture"
              className="pr-16 text-base w-full rounded-xl bg-[#141414] py-2 px-4 my-4 h-[45vh] focus-visible:ring-0 focus-visible:border-0 focus-visible:outline-none text-gray-400"
            />
          </div>

          <div className="flex gap-2 mt-4">
            <button
              className="w-full mt-4 text-red-500"
              onClick={() => setAiModal(false)}
            >
              Cancel
            </button>
            <button className="w-full mt-4" onClick={drawDiagramWithAI}>
              {loading ? "Generating..." : "Generate"}
            </button>
          </div>
        </div>

        {/* Right Column */}
        <div className="w-1/2 flex flex-col">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="bg-[#121212] flex-grow"
            style={{ background: "#121212" }}
          />
          <button
            className="mt-4 self-center w-full"
            onClick={() => saveToDB()}
          >
            {isInserting ? "Inserting..." : "Insert"}
          </button>
        </div>
      </div>
    </div>
  );
}
