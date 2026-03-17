import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg text-text p-6 text-center font-epilogue">
      <h1 className="font-syne text-8xl font-extrabold text-error mb-2">403</h1>
      <h2 className="font-syne text-3xl font-bold mb-4">Access Denied</h2>
      <p className="text-muted mb-8 max-w-md">
        You do not have the necessary permissions to access this page.
      </p>
      <div className="flex gap-4">
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-3 bg-input-bg text-text border border-border rounded-xl font-bold hover:border-accent transition-all"
        >
          Go Back
        </button>
        <Link
          to="/login"
          className="px-6 py-3 bg-accent text-white rounded-xl font-bold hover:brightness-110 transition-all shadow-lg shadow-accent/20"
        >
          Return to Login
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;