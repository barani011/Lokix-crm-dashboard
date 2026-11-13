
import { useState } from 'react';
import { testDatabaseConnection } from '../lib/testConnection';

export default function SupabaseConnectionTest() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleTest = async () => {
    setLoading(true);
    setResult(null);

    const response = await testDatabaseConnection();

    setResult(response);
    setLoading(false);
  };

  return (
    <div className="rounded-xl border border-[#3A2518] bg-[#24170F] p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-white">
            Supabase Database
          </h3>
          <p className="text-sm text-[#A6A09A]">
            Test your live database connection
          </p>
        </div>

        <span className="text-xs text-[#F5B942]">
          {result
            ? result.success
              ? 'Connected'
              : 'Check required'
            : 'Not tested'}
        </span>
      </div>

      <button
        onClick={handleTest}
        disabled={loading}
        className="rounded-lg bg-[#A94F1D] px-4 py-2 text-white font-semibold disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test Database Connection'}
      </button>

      {result && (
        <div
          className={`rounded-lg p-3 text-sm ${
            result.success
              ? 'bg-green-500/10 text-green-400'
              : 'bg-red-500/10 text-red-400'
          }`}
        >
          <p className="font-semibold">
            {result.success
              ? '✓ Connection successful'
              : '✕ Connection test failed'}
          </p>

          <p className="mt-1">{result.message}</p>

          {result.code && (
            <p className="mt-1 text-xs">
              Error code: {result.code}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
