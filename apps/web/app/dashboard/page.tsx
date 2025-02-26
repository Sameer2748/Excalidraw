"use client";
import axios from "axios";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Backend_url } from "../config";
import { toast, Toaster } from "sonner";
import { MdDelete, MdLogout } from "react-icons/md";
import Checker from "../../hooks/Checker";
import { motion, AnimatePresence } from "framer-motion";
import { FiSun, FiMoon } from "react-icons/fi";
import { useTheme } from "../../context/ThemeContext";

interface Room {
  id: number;
  Slug: string;
  adminId: number;
  createdAt: string;
  lastUpdated: string;
}

interface DeletePopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  roomName: string;
}

const DeletePopup = ({
  isOpen,
  onClose,
  onConfirm,
  roomName,
}: DeletePopupProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 flex items-center justify-center z-50 ${
        isOpen ? "" : "pointer-events-none"
      }`}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="bg-zinc-800 rounded-lg p-6 w-full max-w-md shadow-2xl border border-zinc-700 relative z-10"
      >
        <h3 className="text-xl font-semibold text-gray-100 mb-2">
          Confirm Deletion
        </h3>
        <p className="text-gray-300 mb-6">
          Are you sure you want to delete{" "}
          <span className="text-emerald-400">"{roomName}"</span>? This action
          cannot be undone.
        </p>
        <div className="flex justify-end space-x-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-4 py-2 rounded-lg bg-zinc-700 text-gray-300 hover:bg-zinc-600 transition-colors"
            onClick={onClose}
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
            onClick={onConfirm}
          >
            Delete
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const DashboardPage = () => {
  const Router = useRouter();
  const [showCreate, setShowCreate] = useState<boolean>(false);
  const [roomName, setRoomName] = useState<string>("");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [going, setGoing] = useState(false);
  const [welcome, setWelcome] = useState(true);
  const [deletePopup, setDeletePopup] = useState<{
    isOpen: boolean;
    roomId: number | null;
    roomName: string;
  }>({
    isOpen: false,
    roomId: null,
    roomName: "",
  });
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    // Redirect to sign in page if token is not present
    const token = localStorage.getItem("token");
    if (!token) {
      Router.push("/signIn");
    }

    setInterval(() => {
      setWelcome(false);
    }, 3000);
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
        console.log("error in fetching rooms", error);
        setLoading(false);
      }
    };
    fetchRooms();
  }, [Router]);

  const handleDelete = async (id: number, roomName: string) => {
    setDeletePopup({ isOpen: true, roomId: id, roomName });
  };

  const confirmDelete = async () => {
    if (deletePopup.roomId) {
      try {
        await axios.delete(`${Backend_url}/room/${deletePopup.roomId}`, {
          headers: {
            Authorization: `${localStorage.getItem("token")}`,
          },
        });

        setRooms((prevRooms) =>
          prevRooms.filter((r) => r.id !== deletePopup.roomId)
        );
        toast.success("Room deleted successfully");
      } catch (error) {
        console.error("Error in deleting", error.response || error.message);
        toast.error("Room deletion error");
      }
    }
    setDeletePopup({ isOpen: false, roomId: null, roomName: "" });
  };

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
      console.log(res.data.room);
      setRooms([...rooms, res.data.room]);

      console.log("Room created successfully");
      toast.success("Room created successfully");
    } catch (error) {
      console.log("error in Creating", error);
      toast.error("Room creation error");
    }
  };

  const handleGo = async (id: number) => {
    try {
      setGoing(true);
      Router.push(`/canvas/${id}`);
      setInterval(() => {
        setGoing(false);
      }, 3000);
    } catch (error) {
      console.log(error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    Router.push("/");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen w-full p-8 transition-colors duration-300
        ${theme === "dark" ? "bg-zinc-900" : "bg-gray-50"}`}
    >
      <Checker />
      {showCreate && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="inset-0 fixed flex justify-center items-start pt-20 bg-black/60 backdrop-blur-sm z-50"
          >
            <motion.div
              initial={{ y: -100, scale: 0.8, opacity: 0 }}
              animate={{
                y: 0,
                scale: 1,
                opacity: 1,
                transition: {
                  type: "spring",
                  damping: 20,
                  stiffness: 300,
                  duration: 0.6,
                },
              }}
              exit={{
                y: -100,
                scale: 0.8,
                opacity: 0,
                transition: {
                  duration: 0.3,
                },
              }}
              className="relative bg-zinc-800 rounded-lg shadow-2xl p-8 w-full max-w-md border border-zinc-700"
            >
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors"
                onClick={() => setShowCreate(false)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </motion.button>

              <motion.h2
                initial={{ y: -20, opacity: 0 }}
                animate={{
                  y: 0,
                  opacity: 1,
                  transition: { delay: 0.1 },
                }}
                className="text-2xl font-bold text-gray-100 mb-6"
              >
                Create New Space
              </motion.h2>

              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{
                  y: 0,
                  opacity: 1,
                  transition: { delay: 0.2 },
                }}
                className="space-y-6"
              >
                <div className="relative">
                  <input
                    type="text"
                    className="w-full p-3 rounded-lg bg-zinc-700 border border-zinc-600 text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                    placeholder="Enter space name"
                    onChange={(e) => setRoomName(e.target.value)}
                  />
                  <motion.div
                    initial={false}
                    animate={roomName ? { scale: 1 } : { scale: 0 }}
                    className="absolute right-3 top-3 text-emerald-500"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </motion.div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full py-3 rounded-lg font-medium transition-all duration-200 
                    ${
                      roomName
                        ? "bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg shadow-emerald-500/20"
                        : "bg-zinc-700 text-gray-400 cursor-not-allowed"
                    }`}
                  onClick={HandleCreate}
                  disabled={!roomName}
                >
                  Create Space
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}

      {going && (
        <div className="inset-0 fixed flex justify-center items-center bg-black/60 backdrop-blur-sm z-50">
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-2xl text-white"
          >
            Going to Canvas...
          </motion.h1>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex justify-between items-center mb-10"
        >
          <div className="flex items-center justify-between w-full">
            <motion.h1
              whileHover={{ scale: 1.02 }}
              className="text-4xl font-bold relative group"
            >
              <span
                className={`bg-gradient-to-r from-emerald-300 via-blue-400 to-purple-400 text-transparent bg-clip-text bg-size-200 bg-pos-0 group-hover:bg-pos-100 transition-all duration-500
                ${theme === "light" ? "from-emerald-600 via-blue-700 to-purple-700" : ""}`}
              >
                Chitarkar
              </span>
              <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-emerald-300 via-blue-400 to-purple-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
            </motion.h1>

            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleTheme}
                className={`p-2 rounded-full transition-colors duration-300
                  ${
                    theme === "dark"
                      ? "bg-zinc-700 hover:bg-zinc-600 text-yellow-300"
                      : "bg-gray-200 hover:bg-gray-300 text-blue-600"
                  }`}
              >
                {theme === "dark" ? <FiSun size={24} /> : <FiMoon size={24} />}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`px-4 h-[40px] transition-colors shadow-lg rounded
                  ${
                    theme === "dark"
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
                      : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20"
                  }`}
                onClick={() => setShowCreate((prev) => !prev)}
              >
                Create Space
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogout}
                className={`flex items-center gap-2 px-4 h-[40px] rounded-lg transition-all duration-300
                  ${
                    theme === "dark"
                      ? "bg-zinc-700 hover:bg-red-500 text-white"
                      : "bg-gray-200 hover:bg-red-500 text-gray-700 hover:text-white"
                  }`}
              >
                <MdLogout size={20} />
                <span>Logout</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {welcome && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-zinc-800 rounded-lg shadow-xl p-6 border border-zinc-700 mb-6"
          >
            <p className="text-gray-300">Welcome to Excalidraw by Sameer!</p>
          </motion.div>
        )}

        {loading ? (
          <h1 className="text-center text-xl pt-10 text-gray-300">
            Fetching Boards....
          </h1>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1,
                },
              },
            }}
          >
            {rooms.map((room) => (
              <motion.div
                key={room.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0 },
                }}
                whileHover={{ scale: 1.02 }}
                className="relative group"
              >
                <div
                  className={`absolute -inset-0.5 rounded-lg blur opacity-0 group-hover:opacity-75 transition duration-500
                  ${
                    theme === "dark"
                      ? "bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500"
                      : "bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600"
                  }`}
                />

                <div
                  className={`relative rounded-lg border overflow-hidden shadow-lg transition-all duration-300
                  ${
                    theme === "dark"
                      ? "bg-zinc-800 border-zinc-700"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <div
                    className="flex justify-between items-center p-6 cursor-pointer"
                    onClick={() => handleGo(room.id)}
                  >
                    <motion.h2
                      className={`text-lg font-medium transition-colors
                        ${
                          theme === "dark"
                            ? "text-gray-200 group-hover:text-emerald-400"
                            : "text-gray-700 group-hover:text-emerald-600"
                        }`}
                    >
                      {room.Slug}
                    </motion.h2>
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(room.id, room.Slug);
                      }}
                      className={`transition-colors
                        ${
                          theme === "dark"
                            ? "text-gray-400 hover:text-red-500"
                            : "text-gray-500 hover:text-red-600"
                        }`}
                    >
                      <MdDelete size={24} />
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
      <Toaster />

      <AnimatePresence>
        {deletePopup.isOpen && (
          <DeletePopup
            isOpen={deletePopup.isOpen}
            onClose={() =>
              setDeletePopup({ isOpen: false, roomId: null, roomName: "" })
            }
            onConfirm={confirmDelete}
            roomName={deletePopup.roomName}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DashboardPage;
