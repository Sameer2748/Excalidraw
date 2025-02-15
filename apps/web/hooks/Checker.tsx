"use client"; // Ensures this file runs only on the client
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const Checker = () => {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/signIn"); // Redirect to Sign In if no token
    } else {
      router.push("/dashboard"); // Redirect to Dashboard if token is present
    }
  }, []);

  return null; // No UI, just logic
};

export default Checker;
