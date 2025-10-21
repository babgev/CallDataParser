import { useState } from 'react';

interface CalldataInputProps {
  onParse: (calldata: string) => void;
  loading: boolean;
}

export function CalldataInput({ onParse, loading }: CalldataInputProps) {
  const [calldata, setCalldata] = useState('');
  const [error, setError] = useState('');

  const handleParse = () => {
    setError('');

    if (!calldata.trim()) {
      setError('Please enter calldata');
      return;
    }

    if (!calldata.startsWith('0x')) {
      setError('Calldata must start with 0x');
      return;
    }

    onParse(calldata.trim());
  };

  const handleClear = () => {
    setCalldata('');
    setError('');
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setCalldata(text);
      setError('');
    } catch (err) {
      setError('Failed to read from clipboard');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        Universal Router Calldata Parser
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Paste Universal Router transaction calldata to decode and view all commands
      </p>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="calldata"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Calldata (0x...)
          </label>
          <textarea
            id="calldata"
            value={calldata}
            onChange={(e) => setCalldata(e.target.value)}
            placeholder="0x24856bc3000000000000000000000000..."
            className="w-full h-32 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     font-mono text-sm resize-y"
            disabled={loading}
          />
          {error && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleParse}
            disabled={loading || !calldata.trim()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400
                     text-white font-medium rounded-md transition-colors
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {loading ? 'Parsing...' : 'Parse Calldata'}
          </button>

          <button
            onClick={handlePaste}
            disabled={loading}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600
                     text-gray-900 dark:text-white font-medium rounded-md transition-colors
                     focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Paste
          </button>

          <button
            onClick={handleClear}
            disabled={loading || !calldata}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600
                     text-gray-900 dark:text-white font-medium rounded-md transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed
                     focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
