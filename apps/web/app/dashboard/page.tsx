"use client";
import axios from "axios";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Backend_url } from "../config";
import { toast, Toaster } from "sonner";

interface Room {
  id: number;
  Slug: string;
  adminId: number;
  createdAt: string;
  lastUpdated: string;
}
const DashboardPage = () => {
  const Router = useRouter();
  const [showCreate, setShowCreate] = useState<boolean>(false);
  const [roomName, setRoomName] = useState<string>("");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Redirect to sign in page if token is not present
    const token = localStorage.getItem("token");
    if (!token) {
      Router.push("/signIn");
    }

    const fetchRooms = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${Backend_url}/room/`, {
          headers: {
            Authorization: `${localStorage.getItem("token")}`,
          },
        });
        console.log(res.data);
        setRooms(res.data.rooms);
        setLoading(false);
      } catch (error) {
        console.log("error in fetching rooms");
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  const HandleCreate = async () => {
    setShowCreate(false);
    try {
      const res = await axios.post(
        `${Backend_url}/room/create-room`,
        { roomName },
        {
          headers: {
            Authorization: `${localStorage.getItem("token")}`,
          },
        }
      );
      console.log(res.data.rooms);
      setRooms([...rooms, res.data.rooms]);

      console.log("Room created successfully");
      toast.success("Room created successfully");
    } catch (error) {
      console.log("error in Creating");
      toast.error("Room creation error");
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-500 to-purple-600 p-8">
      {showCreate && (
        <div className="inset-0 fixed flex justify-center items-center bg-black bg-opacity-50 z-50">
          <div className="relative bg-white rounded-lg shadow-xl p-6 flex flex-col justify-center items-center">
            <p
              className="absolute right-3 top-1 cursor-pointer "
              onClick={() => setShowCreate(false)}
            >
              X
            </p>
            <input
              type="text"
              className="w-full p-2 rounded-lg border border-gray-400 focus:ring-0 focus:outline-none"
              placeholder="Enter space name"
              onChange={(e) => setRoomName(e.target.value)}
            />
            <button
              className="w-auto h-[40px] p-2 bg-blue-500 text-white rounded-xl mt-4"
              onClick={HandleCreate}
            >
              Create
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white mb-6">Dashboard</h1>
          <button
            className="w-auto h-[40px] p-2 bg-white text-black rounded-xl"
            onClick={() => setShowCreate((prev) => !prev)}
          >
            Create Space
          </button>
        </div>
        <div className="bg-white rounded-lg shadow-xl p-6">
          <p className="text-gray-700">Welcome to your dashboard!</p>
        </div>
        {loading ? (
          <h1 className="text-center  text-xl pt-10 text-white">
            Fetching Boards....
          </h1>
        ) : (
          <div>
            {rooms.map((room) => (
              <div
                className="bg-white rounded-lg shadow-xl p-6 mt-4 cursor-pointer"
                key={room.id}
                onClick={() => Router.push(`/canvas/${room.id}`)}
              >
                <h1>{room.Slug}</h1>
              </div>
            ))}
          </div>
        )}
      </div>
      <Toaster />
    </div>
  );
};

export default DashboardPage;
