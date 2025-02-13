"use client";
import { useRouter } from "next/navigation";

const Navbar = (): JSX.Element => {
  const Router = useRouter();
  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <span className="text-xl font-bold text-primary">Excalidraw</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              className="text-gray-600 hover:text-primary"
              onClick={() => Router.push("/signIn")}
            >
              Sign In
            </button>
            <button
              className="bg-primary hover:bg-primary-hover text-white"
              onClick={() => Router.push("/signUp")}
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
export default Navbar;
