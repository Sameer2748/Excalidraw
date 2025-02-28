"use client";
// @ts-nocheck
import { BiRectangle } from "react-icons/bi";
import { FaRegCircle } from "react-icons/fa";
import { IoArrowForwardOutline } from "react-icons/io5";
import { BsPencil } from "react-icons/bs";
import { CgShapeRhombus } from "react-icons/cg";
import { PiMinusBold } from "react-icons/pi";
import { BsThreeDots } from "react-icons/bs";
import { BsPencilSquare } from "react-icons/bs";
import { FaHandBackFist } from "react-icons/fa6";

import React, { useEffect, useRef, useState } from "react";
import { initDraw } from "../draw";
import { WebSocketService } from "../hooks/WebSocketService";
import { useRouter } from "next/navigation";

import DiagramModal from "./AiModal";

export function Canvas({
  RoomId,
  socket,
}: {
  RoomId: string;
  socket: WebSocketService;
}) {
  const Router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawInstanceRef = useRef<ReturnType<typeof initDraw> | null>(null);
  const [currentShape, setCurrentShape] = useState("Hand");
  const [currentColor, setCurrentColor] = useState("white");
  const [currentStyle, setCurrentStyle] = useState("normal");
  const [currentSize, setCurrentSize] = useState(1);
  const [OpenAiShape, setOpenAiShape] = useState(false);

  const centerCanvas = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;

    if (!canvas || !container) return;

    // Get the canvas and container dimensions
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Calculate the scroll position to center the canvas
    const scrollX = (canvasWidth - containerWidth) / 2;
    const scrollY = (canvasHeight - containerHeight) / 2;

    // Scroll the container to the center
    container.scrollTo({
      left: scrollX,
      top: scrollY,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const token = localStorage.getItem("token");
    if (!token) {
      Router.push("/signIn");
    }

    // Only initialize once
    if (!drawInstanceRef.current) {
      drawInstanceRef.current = initDraw(canvas, RoomId, socket);
    }

    centerCanvas();

    return () => {
      if (drawInstanceRef.current) {
        drawInstanceRef.current.cleanup();
        drawInstanceRef.current = null;
      }
    };
  }, [RoomId, socket]);

  //store the ref and call the setshape fiunction which was returned from initdraw
  useEffect(() => {
    console.log(currentShape);

    if (drawInstanceRef.current) {
      drawInstanceRef?.current?.setCurrentShape(currentShape);
    }
  }, [currentShape]);
  useEffect(() => {
    if (drawInstanceRef.current) {
      drawInstanceRef?.current?.setCurrentColor(currentColor);
    }
  }, [currentColor]);
  useEffect(() => {
    if (drawInstanceRef.current) {
      drawInstanceRef?.current?.setCurrentWidth(currentSize);
    }
  }, [currentSize]);
  useEffect(() => {
    if (drawInstanceRef.current) {
      drawInstanceRef?.current?.setCurrentStyle(currentStyle);
    }
  }, [currentStyle]);

  const downloadCanvasAsImage = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const image = canvas.toDataURL("image/png"); // Convert canvas to data URL
      const link = document.createElement("a");
      link.href = image;
      link.download = "canvas-image.png"; // Filename for the downloaded image
      link.click();
    }
  };

  const movetocenterofcanvas = () => {
    centerCanvas();
  };

  return (
    <div ref={containerRef} className="w-full h-screen overflow-auto  ">
      <canvas
        width={8000}
        height={8000}
        ref={canvasRef}
        className={`bg-black relative ${
          currentShape === "Pencil" ? "cursor-pencil" : "cursor-crosshair"
        }`}
      />
      <div className="fixed top-[40%] left-2 flex flex-col justify-between  bg-[#232329] text-white text-sm gap-2 p-2 rounded">
        <div className=" flex flex-col gap-1">
          <p>Color</p>
          <div className="flex gap-2 p-1">
            <div
              className={`${currentColor === "#d3d3d3" ? "bg-[#403E6A] border border-[#a19ee0]" : "bg-gray-400"} p-1 rounded`}
              onClick={() => setCurrentColor("#d3d3d3")}
            >
              <div className=" w-[20px] h-[20px] rounded bg-[#d3d3d3] cursor-pointer " />
            </div>
            <div
              className={`${currentColor === "#f29b9e" ? "bg-[#403E6A] border border-[#a19ee0]" : "bg-gray-400"} p-1 rounded`}
              onClick={() => setCurrentColor("#f29b9e")}
            >
              <div className=" w-[20px] h-[20px] rounded bg-[#f29b9e] cursor-pointer" />
            </div>
            <div
              className={`${currentColor === "#4da153" ? "bg-[#403E6A] border border-[#a19ee0]" : "bg-gray-400"} p-1 rounded`}
              onClick={() => setCurrentColor("#4da153")}
            >
              <div
                className=" w-[20px] h-[20px] rounded bg-[#4da153] cursor-pointer"
                onClick={() => setCurrentColor("#4da153")}
              />
            </div>
            <div
              className={`${currentColor === "#63b1f7" ? "bg-[#403E6A] border border-[#a19ee0]" : "bg-gray-400"} p-1 rounded`}
              onClick={() => setCurrentColor("#63b1f7")}
            >
              <div className=" w-[20px] h-[20px] rounded bg-[#63b1f7] cursor-pointer" />
            </div>
            <div
              className={`${currentColor === "#b7622a" ? "bg-[#403E6A] border border-[#a19ee0]" : "bg-gray-400"} p-1 rounded`}
              onClick={() => setCurrentColor("#b7622a")}
            >
              <div className=" w-[20px] h-[20px] rounded bg-[#b7622a] cursor-pointer" />
            </div>
          </div>
        </div>
        <div className=" flex flex-col gap-1">
          <p>Stroke Width</p>
          <div className="flex gap-2 p-1  justify-start gap-2 items-center">
            <div
              className={`p-1 bg-[#403E6A] height-[20px]  cursor-pointer ${currentSize === 1 ? "bg-[#403E6A] border border-[#a19ee0]" : "bg-gray-400"} rounded `}
              onClick={() => setCurrentSize(1)}
            >
              <div className=" w-[20px] h-[2px] rounded bg-white my-auto" />
            </div>
            <div
              className={`p-1 bg-[#403E6A] height-[20px] cursor-pointer ${currentSize === 3 ? "bg-[#403E6A] border border-[#a19ee0]" : "bg-gray-400"} rounded `}
              onClick={() => setCurrentSize(3)}
            >
              <div className=" w-[20px] h-[6px] rounded bg-white" />
            </div>
            <div
              className={`p-1 bg-[#403E6A] height-[20px] cursor-pointer ${currentSize === 5 ? "bg-[#403E6A] border border-[#a19ee0]" : "bg-gray-400"} rounded `}
              onClick={() => setCurrentSize(5)}
            >
              <div className=" w-[20px] h-[8px] rounded bg-white" />
            </div>
          </div>
        </div>
        <div className=" flex flex-col gap-1">
          <p>Stroke Style</p>
          <div className="flex gap-2 p-1  justify-start gap-2 items-center">
            <div
              className={`p-1 bg-[#403E6A] height-[20px] cursor-pointer ${currentStyle === "normal" ? "bg-[#403E6A] border border-[#a19ee0]" : "bg-gray-400"} rounded `}
              onClick={() => setCurrentStyle("normal")}
            >
              <PiMinusBold color="white" className="" />
            </div>
            <div
              className={`p-1 bg-[#403E6A] cursor-pointer ${currentStyle === "medium" ? "bg-[#403E6A] border border-[#a19ee0]" : "bg-gray-400"} rounded `}
              onClick={() => setCurrentStyle("medium")}
            >
              <BsThreeDots color="white" />
            </div>
            <div
              className={` p-1 bg-[#403E6A]  height-[20px] flex justify-center items-center  cursor-pointer ${currentStyle === "large" ? "bg-[#403E6A] border border-[#a19ee0]" : "bg-gray-400"} rounded `}
              onClick={() => setCurrentStyle("large")}
            >
              <BsThreeDots color="white" /> <BsThreeDots color="white" />
            </div>
          </div>
        </div>
      </div>
      <div className="fixed top-0 right-[40%] right-4 flex gap-2 mt-5 bg-gray-400 px-10 gap-4 py-2 rounded-xl flex justify-between items-center">
        <FaHandBackFist
          color="white"
          onClick={() => setCurrentShape("Hand")}
          className={`p-1 rounded ${
            currentShape === "Hand" ? "bg-blue-500" : ""
          } text-black cursor-pointer`}
          size={27}
        />
        <BiRectangle
          color="white"
          onClick={() => setCurrentShape("Rect")}
          className={`p-1 rounded ${
            currentShape === "Rect" ? "bg-blue-500" : ""
          } text-black cursor-pointer`}
          size={27}
        />
        <FaRegCircle
          color="white"
          onClick={() => setCurrentShape("Circle")}
          className={`p-1 rounded ${
            currentShape === "Circle" ? "bg-blue-500" : ""
          } text-black cursor-pointer`}
          size={25}
        />
        <IoArrowForwardOutline
          color="white"
          onClick={() => setCurrentShape("Line")}
          className={`p-1 rounded ${
            currentShape === "Line" ? "bg-blue-500" : ""
          } text-black cursor-pointer`}
          size={27}
        />
        <CgShapeRhombus
          color="white"
          onClick={() => setCurrentShape("RegularPolygon")}
          className={`p-1 rounded ${
            currentShape === "RegularPolygon" ? "bg-blue-500" : ""
          } text-black cursor-pointer`}
          size={29}
        />
        <BsPencil
          color="white"
          onClick={() => setCurrentShape("Pencil")}
          className={`p-1 rounded ${
            currentShape === "Pencil" ? "bg-blue-500" : ""
          } text-black cursor-pointer`}
          size={25}
        />
        <BsPencilSquare
          color="white"
          className={`p-1 rounded ${
            currentShape === "Input" ? "bg-blue-500" : ""
          } text-black cursor-pointer`}
          size={29}
          onClick={() => setCurrentShape("Input")}
        />
        {/* <div
          className="flex gap-2 cursor-pointer"
          onClick={() => setOpenAiShape((prev) => !prev)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            viewBox="0 0 64 64"
            className="w-5 h-5"
            fill="#fff"
          >
            <path d="M22.625 2c0 15.834-8.557 30-20.625 30 12.068 0 20.625 14.167 20.625 30 0-15.833 8.557-30 20.625-30-12.068 0-20.625-14.166-20.625-30M47 32c0 7.918-4.277 15-10.313 15C42.723 47 47 54.084 47 62c0-7.916 4.277-15 10.313-15C51.277 47 47 39.918 47 32zM51.688 2c0 7.917-4.277 15-10.313 15 6.035 0 10.313 7.084 10.313 15 0-7.916 4.277-15 10.313-15-6.036 0-10.313-7.083-10.313-15" />
          </svg>
          AI
        </div> */}

        <svg
          onClick={() => setOpenAiShape((prev) => !prev)}
          className="cursor-pointer"
          width="24"
          height="24"
          color="White"
          aria-hidden="true"
          focusable="false"
          role="img"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2" // Corrected camelCase
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <g>
            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
            <path d="M12 3l-4 7h8z"></path>
            <path d="M17 17m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"></path>
            <path d="M4 14m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z"></path>
          </g>
        </svg>

        <button onClick={movetocenterofcanvas} className="text-white">
          reset
        </button>

        {/* <div>AI</div> */}
      </div>
      {OpenAiShape && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] bg-black bg-opacity-50">
          <DiagramModal
            canvasReff={canvasRef}
            setModal={() => setOpenAiShape((prev) => !prev)}
          />
        </div>
      )}
      <button
        onClick={downloadCanvasAsImage}
        className="fixed top-6 right-6 bg-white p-2 rounded text-black"
      >
        Download
      </button>
    </div>
  );
}
