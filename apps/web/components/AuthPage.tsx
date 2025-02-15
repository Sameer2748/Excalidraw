"use client";
import axios from "axios";
import { useRouter } from "next/navigation";
import React from "react";
import { Backend_url } from "../app/config";
import { toast, Toaster } from "sonner";
import Checker from "../hooks/Checker";

const AuthPage = ({ isSignIn }: { isSignIn: boolean }) => {
  const Router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [username, setUsername] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("handleSubmit", {
      email,
      password,
      ...(isSignIn ? {} : { username }),
    });

    try {
      const user = await axios.post(
        `${Backend_url}/user/${isSignIn ? "signIn" : "signUp"}`,
        {
          email,
          password,
          ...(!isSignIn && { username }),
        }
      );
      toast.success(`${isSignIn ? "Signed In" : "Signed Up"}successfully`);
      if (isSignIn) {
        localStorage.setItem("token", user.data.token);
      }
      Router.push("/dashboard");
      console.log(user);
    } catch (error) {
      console.log(error);
      if (error.status === 401) {
        toast.error("Invalid credentials");
      }
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-500 to-purple-600 flex justify-center items-center p-4">
      <Checker />
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-center text-gray-800">
            {isSignIn ? "Welcome back!" : "Create an account"}
          </h2>
          <p className="text-center text-gray-600 mt-2">
            {isSignIn
              ? "Enter your credentials to access your account"
              : "Enter your details to get started"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isSignIn && (
            <div>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          )}

          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {isSignIn ? "Sign In" : "Sign Up"}
          </button>

          <div className="text-center text-sm text-gray-600">
            {isSignIn ? (
              <p onClick={() => Router.push("/signUp")}>
                Dont have an account?{" "}
                <p className="text-blue-600 hover:underline cursor-pointer">
                  Sign up
                </p>
              </p>
            ) : (
              <p onClick={() => Router.push("/signIn")}>
                Already have an account?{" "}
                <p className="text-blue-600 hover:underline cursor-pointer">
                  Sign In
                </p>
              </p>
            )}
          </div>
        </form>
        <Toaster />
      </div>
    </div>
  );
};

export default AuthPage;
