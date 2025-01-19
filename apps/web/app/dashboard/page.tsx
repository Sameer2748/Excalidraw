"use client";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

const DashboardPage = () => {
  const Router = useRouter();

  useEffect(() => {
    // Redirect to sign in page if token is not present
    const token = localStorage.getItem("token");
    if (!token) {
      Router.push("/signIn");
    }
  }, []);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-500 to-purple-600 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Dashboard</h1>
        <div className="bg-white rounded-lg shadow-xl p-6">
          <p className="text-gray-700">Welcome to your dashboard!</p>
        </div>
        <div
          className="bg-white rounded-lg shadow-xl p-6 mt-4 cursor-pointer"
          onClick={() => Router.push("/canvas/1")}
        >
          <h1>Canvas1</h1>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
