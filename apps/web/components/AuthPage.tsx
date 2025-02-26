"use client";
import axios from "axios";
import { useRouter } from "next/navigation";
import React from "react";
import { Backend_url } from "../app/config";
import { toast, Toaster } from "sonner";
import { motion } from "framer-motion";

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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen w-full bg-zinc-900 flex justify-center items-center p-4"
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="bg-zinc-800 rounded-lg shadow-2xl w-full max-w-md p-8"
      >
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-center text-gray-100">
            {isSignIn ? "Welcome back!" : "Create an account"}
          </h2>
          <p className="text-center text-gray-400 mt-2">
            {isSignIn
              ? "Enter your credentials to access your account"
              : "Enter your details to get started"}
          </p>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          className="space-y-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          {!isSignIn && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-zinc-700 border border-zinc-600 text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none transition-all"
              />
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.2 }}
          >
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-zinc-700 border border-zinc-600 text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none transition-all"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.2 }}
          >
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-zinc-700 border border-zinc-600 text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none transition-all"
            />
          </motion.div>

          <motion.button
            type="submit"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full bg-emerald-600 text-gray-100 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-800"
          >
            {isSignIn ? "Sign In" : "Sign Up"}
          </motion.button>

          <div className="text-center text-sm text-gray-400">
            {isSignIn ? (
              <p onClick={() => Router.push("/signUp")}>
                Don't have an account?{" "}
                <span className="text-gray-200 hover:text-white cursor-pointer transition-colors">
                  Sign up
                </span>
              </p>
            ) : (
              <p onClick={() => Router.push("/signIn")}>
                Already have an account?{" "}
                <span className="text-gray-200 hover:text-white cursor-pointer transition-colors">
                  Sign In
                </span>
              </p>
            )}
          </div>
        </motion.form>
        <Toaster />
      </motion.div>
    </motion.div>
  );
};

export default AuthPage;
