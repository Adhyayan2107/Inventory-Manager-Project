import React from "react";
export default function LoadingSpinner() {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white mx-auto"></div>
          <p className="text-white text-xl mt-4 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }