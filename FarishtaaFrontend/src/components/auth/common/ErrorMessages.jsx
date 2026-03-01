import React from 'react';

const ErrorMessages = ({ errors = [] }) => {
  if (!Array.isArray(errors) || errors.length === 0) {
    return null;
  }
  
  return (
    <div className="my-4">
      <div className="flex items-center bg-red-50 border border-red-500 text-red-700 px-4 py-3 rounded-lg" role="alert">
        <svg
          className="w-5 h-5 mr-2 shrink-0 text-red-500"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M18 10c0 4.418-3.582 8-8 8S2 14.418 2 10 5.582 2 10 2s8 3.582 8 8zm-8-1a1 1 0 00-1 1v3a1 1 0 102 0v-3a1 1 0 00-1-1zm0-4a1.5 1.5 0 100 3 1.5 1.5 0 000-3z"
            clipRule="evenodd"
          />
        </svg>
        <div className="flex-1">
          <ul className="list-disc pl-5">
            {errors.map((msg, idx) => <li key={idx}>{msg}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ErrorMessages;
