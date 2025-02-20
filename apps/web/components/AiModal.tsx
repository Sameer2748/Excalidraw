import { useRef, useState } from "react";
import axios from "axios";
import { usePathname } from "next/navigation";
import { CanvasShapeManager } from "../draw/canvasDraw";
import { Backend_url } from "../app/config";
import mermaid from "mermaid";

// Initialize mermaid with dark theme
mermaid.initialize({
  startOnLoad: true,
  theme: "dark",
  themeVariables: {
    background: "#1e1e1e",
    primaryColor: "#fff",
    secondaryColor: "#fff",
    tertiaryColor: "#fff",
    noteTextColor: "#fff",
    fontFamily: "arial",
    fontSize: "16px",
  },
});

export default function DiagramModal({
  setModal,
  canvasReff,
}: {
  setModal: (s: boolean) => void;
  canvasReff: React.RefObject<HTMLCanvasElement>;
}): React.JSX.Element {
  const pathname = usePathname();
  const roomId = pathname.split("/canvas/")[1];
  const [loading, setLoading] = useState(false);
  const [isInserting, setIsInserting] = useState(false);
  const [shapes, setShapes] = useState([]);
  const [activeTab, setActiveTab] = useState("text");
  const [mermaidSvg, setMermaidSvg] = useState("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const promptRef = useRef<HTMLTextAreaElement | null>(null);

  const generateDiagram = async () => {
    if (activeTab === "text") {
      await drawDiagramWithAI();
    } else {
      await renderMermaid();
    }
  };

  const renderMermaid = async () => {
    try {
      setLoading(true);
      const { svg } = await mermaid.render(
        "diagram",
        promptRef.current?.value || ""
      );
      setMermaidSvg(svg);
    } catch (error) {
      console.error("Error rendering Mermaid diagram:", error);
    } finally {
      setLoading(false);
    }
  };

  const drawDiagramWithAI = async () => {
    try {
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
      const normalizedShape = normalizeShape(shape);
      if (normalizedShape) {
        canvasShapeManager.drawShape(normalizedShape);
      }
    });

    setShapes(shapes);
  };

  const normalizeShape = (shape: any): Shape | null => {
    const type = shape.type.toLowerCase();

    switch (type) {
      case "rect":
        return {
          type: "rect",
          startX: shape.x,
          startY: shape.y,
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
      case "input":
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

  const addShapesToMainCanvas = (shapes: any[]) => {
    if (!canvasReff.current) return;

    const ctx = canvasReff.current.getContext("2d");
    if (!ctx) return;

    const canvasShapeManager = new CanvasShapeManager(ctx);

    // Calculate the center of the main canvas
    const canvasCenterX = canvasReff.current.width / 2;
    const canvasCenterY = canvasReff.current.height / 2;

    // Calculate the bounding box of all shapes
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    shapes.forEach((shape) => {
      const x = shape.x || shape.startX || shape.centerX || 0;
      const y = shape.y || shape.startY || shape.centerY || 0;
      const width = shape.width || shape.radius * 2 || 0;
      const height = shape.height || shape.radius * 2 || 0;

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + width);
      maxY = Math.max(maxY, y + height);
    });

    // Calculate the offset to center the shapes
    const shapesWidth = maxX - minX;
    const shapesHeight = maxY - minY;
    const offsetX = canvasCenterX - shapesWidth / 2 - minX;
    const offsetY = canvasCenterY - shapesHeight / 2 - minY;

    // Add shapes to the main canvas with the calculated offset
    shapes.forEach((shape) => {
      const adjustedShape = {
        ...shape,
        x: (shape.x || shape.startX || shape.centerX || 0) + offsetX,
        y: (shape.y || shape.startY || shape.centerY || 0) + offsetY,
        startX: shape.startX ? shape.startX + offsetX : undefined,
        startY: shape.startY ? shape.startY + offsetY : undefined,
        endX: shape.endX ? shape.endX + offsetX : undefined,
        endY: shape.endY ? shape.endY + offsetY : undefined,
        centerX: shape.centerX ? shape.centerX + offsetX : undefined,
        centerY: shape.centerY ? shape.centerY + offsetY : undefined,
      };

      const normalizedShape = normalizeShape(adjustedShape);
      if (normalizedShape) {
        canvasShapeManager.drawShape(normalizedShape);
      }
    });
  };

  const saveToDB = async () => {
    try {
      setIsInserting(true);

      if (activeTab === "text") {
        // Add shapes to the main canvas
        addShapesToMainCanvas(shapes);

        // Save to database
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
          setIsInserting(false);
          setModal(false);
        }
      } else {
        // Handle Mermaid SVG
        const svgShape = {
          type: "svg",
          content: mermaidSvg,
          x: 50,
          y: 50,
          width: 800,
          height: 600,
        };

        const response = await axios.post(
          `${Backend_url}/ai/diagram-to-canvas`,
          {
            diagram: [svgShape],
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
          // Add SVG to main canvas
          if (canvasReff.current) {
            const ctx = canvasReff.current.getContext("2d");
            if (ctx) {
              const img = new Image();
              img.onload = () => {
                ctx.drawImage(
                  img,
                  svgShape.x,
                  svgShape.y,
                  svgShape.width,
                  svgShape.height
                );
              };
              img.src = "data:image/svg+xml;base64," + btoa(mermaidSvg);
            }
          }

          setIsInserting(false);
          setModal(false);
        }
      }
    } catch (error) {
      console.error("Error saving diagram:", error);
      setIsInserting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.currentTarget === e.target) {
          setModal(false);
        }
      }}
    >
      <div className="w-[1000px] p-6 mx-4 bg-white rounded-lg shadow-xl">
        <div className="flex items-center gap-4 mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Text to diagram
          </h2>
          <div className="px-2 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded">
            AI Beta
          </div>
          <div className="flex ml-auto space-x-2">
            <button
              onClick={() => setActiveTab("text")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "text"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Text to diagram
            </button>
            {/* <button
              onClick={() => setActiveTab("mermaid")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "mermaid"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Mermaid
            </button> */}
          </div>
        </div>

        <div className="flex gap-8">
          <div className="flex-1">
            <p className="mb-4 text-sm text-gray-600">
              {activeTab === "text"
                ? "Currently we use Mermaid as a middle step, so you'll get best results if you describe a diagram, workflow, flow chart, and similar."
                : "Currently only Flowchart, Sequence, and Class Diagrams are supported. The other types will be rendered as image in Excalidraw."}
            </p>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">
                {activeTab === "text" ? "Prompt" : "Mermaid Syntax"}
              </label>
              <textarea
                ref={promptRef}
                className="w-full h-[400px] mt-1 p-3 text-sm font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50"
                placeholder={
                  activeTab === "text"
                    ? "Describe what you want to see..."
                    : "Enter Mermaid syntax here..."
                }
              />
            </div>

            <button
              onClick={generateDiagram}
              className="inline-flex items-center px-4 py-2 mt-4 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              {loading ? (
                "Generating..."
              ) : (
                <>
                  Generate
                  <span className="ml-2 text-xs">Cmd + Enter</span>
                </>
              )}
            </button>
          </div>

          <div className="flex-1">
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700">Preview</h3>
            </div>
            <div className="relative h-[400px] bg-[#1e1e1e] rounded-lg overflow-hidden">
              {activeTab === "text" ? (
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={600}
                  className="w-full h-full"
                />
              ) : (
                <div
                  className="w-full h-full p-4 text-white"
                  dangerouslySetInnerHTML={{ __html: mermaidSvg }}
                />
              )}
            </div>
            <button
              onClick={saveToDB}
              disabled={!shapes.length && !mermaidSvg}
              className="w-full mt-4 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isInserting ? "Inserting..." : "Insert"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
