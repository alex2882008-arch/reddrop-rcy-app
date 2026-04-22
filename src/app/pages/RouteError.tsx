import React from 'react';
import { Link, isRouteErrorResponse, useRouteError } from 'react-router';

export default function RouteError() {
  const error = useRouteError();

  let title = 'Something went wrong';
  let message = 'Please refresh the page or go back to the dashboard.';

  if (isRouteErrorResponse(error)) {
    title = `${error.status} ${error.statusText}`;
    message = typeof error.data === 'string' ? error.data : message;
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 p-6 text-center shadow-sm">
        <h1 className="text-xl font-bold text-slate-800 mb-2">{title}</h1>
        <p className="text-sm text-slate-600 mb-5">{message}</p>
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
          >
            Refresh
          </button>
          <Link to="/" className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-100">
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
