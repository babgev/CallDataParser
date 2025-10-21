import { useState } from 'react';
import { CalldataInput } from './components/CalldataInput';
import { ParsedOutput } from './components/ParsedOutput';
import { parseCalldata } from './utils/parser';
import type { ParsedCommand } from './types';

function App() {
  const [commands, setCommands] = useState<ParsedCommand[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleParse = async (calldata: string) => {
    setLoading(true);
    setError(null);
    setCommands([]);

    // Small delay to show loading state
    await new Promise((resolve) => setTimeout(resolve, 100));

    const result = parseCalldata(calldata);

    if (result.success && result.commands) {
      setCommands(result.commands);
    } else {
      setError(result.error || 'Failed to parse calldata');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200
                    dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Uniswap Universal Router Parser
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Decode V2, V3, and V4 swap transactions
          </p>
        </div>

        {/* Input Section */}
        <CalldataInput onParse={handleParse} loading={loading} />

        {/* Error Display */}
        {error && (
          <div className="w-full max-w-4xl mx-auto p-4 bg-red-50 dark:bg-red-900/20
                        border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h3 className="font-semibold text-red-800 dark:text-red-300">
                  Parse Error
                </h3>
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Output Section */}
        <ParsedOutput commands={commands} />

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-12">
          <p>
            Powered by{' '}
            <a
              href="https://github.com/Uniswap/sdks"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              @uniswap/universal-router-sdk
            </a>
            {' & '}
            <a
              href="https://viem.sh"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              viem
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
