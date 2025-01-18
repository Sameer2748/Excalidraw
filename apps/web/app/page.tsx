"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const [roomId, setRoomId] = useState("");
  const router = useRouter();

  const handleRedirect = () => {
    router.push(`/room/${roomId}`);
  };
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100vw",
        height: "100vh",
      }}
    >
      <div>
        <input
          style={{ padding: "20px" }}
          type="text"
          onChange={(e) => setRoomId(e.target.value)}
        />
        <button style={{ padding: "20px" }} onClick={handleRedirect}>
          Join
        </button>
      </div>
    </div>
  );
}
