"use client";
import React, { useEffect, useRef, useState } from "react";
import { initDraw } from "../draw";

export function Canvas({
  RoomId,
  socket,
}: {
  RoomId: string;
  socket: WebSocket;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentShape, setCurrentShape] = useState("Rect");

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      initDraw(canvas, currentShape, RoomId, socket);
    }
  }, [canvasRef, currentShape]); // Add currentShape to dependency array

  return (
    <div>
      <canvas width={2000} height={2000} ref={canvasRef}></canvas>
      <div className="absolute bottom-0 right-0">
        <button
          className={`p-2 m-2 ${
            currentShape === "Rect" ? "bg-blue-500" : "bg-white"
          } text-black`}
          onClick={() => setCurrentShape("Rect")}
        >
          Rectangle
        </button>
        <button
          className={`p-2 m-2 ${
            currentShape === "Circle" ? "bg-blue-500" : "bg-white"
          } text-black`}
          onClick={() => setCurrentShape("Circle")}
        >
          Circle
        </button>
      </div>
    </div>
  );
}
