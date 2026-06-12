import React from 'react';

const LoadingFallback = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-950">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        <p className="text-zinc-300 text-base sm:text-lg md:text-lg">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingFallback;
