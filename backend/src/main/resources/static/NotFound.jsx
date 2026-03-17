import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg text-text p-6 text-center font-epilogue">
      <h1 className="font-syne text-8xl font-extrabold text-accent mb-2">404</h1>
      <h2 className="font-syne text-3xl font-bold mb-4">Page Not Found</h2>
      <p className="text-muted mb-8 max-w-md">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        to="/login"
        className="px-6 py-3 bg-accent text-white rounded-xl font-bold hover:brightness-110 transition-all shadow-lg shadow-accent/20"
      >
        Go to Login
      </Link>
    </div>
  );
};

export default NotFound;