import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="flex flex-col items-center"
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <svg width="120" height="120" fill="none" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="58" stroke="#2563eb" strokeWidth="4" fill="#eff6ff" />
            <text x="50%" y="50%" textAnchor="middle" dy=".3em" fontSize="48" fontWeight="bold" fill="#2563eb">404</text>
          </svg>
        </motion.div>
        <h1 className="mt-8 text-4xl font-bold text-gray-800">Page Not Found</h1>
        <p className="mt-4 text-lg text-gray-500 text-center max-w-md">
          Oops! The page you are looking for does not exist or has been moved.<br />
          Let's get you back to something useful.
        </p>
        <button
          onClick={() => navigate("/")}
          className="mt-8 px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold shadow-md hover:bg-blue-700 transition"
        >
          Go Home
        </button>
      </motion.div>
    </div>
  );
};

export default NotFound;
