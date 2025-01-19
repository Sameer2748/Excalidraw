"use client";
import React, { useEffect, useRef } from "react";
import { initDraw } from "../../../draw";

const page = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      initDraw(canvas);
    }
  }, [canvasRef]);
  return (
    <div>
      <canvas width={2000} height={2000} ref={canvasRef}></canvas>
    </div>
  );
};

export default page;
