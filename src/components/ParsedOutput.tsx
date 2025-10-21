import { useState } from 'react';
import type { ParsedCommand } from '../types';
import { CommandCard } from './CommandCard';
import { copyToClipboard } from '../utils/formatter';

interface ParsedOutputProps {
  commands: ParsedCommand[];
}

export function ParsedOutput({ commands }: ParsedOutputProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyJSON = async () => {
    const json = JSON.stringify(commands, null, 2);
    const success = await copyToClipboard(json);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (commands.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Parsed Commands ({commands.length})
        </h2>
        <button
          onClick={handleCopyJSON}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white
                   font-medium rounded-md transition-colors text-sm
                   focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          {copied ? '✓ Copied!' : 'Copy JSON'}
        </button>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Click on any command to expand and view its parameters
      </p>

      <div className="space-y-3">
        {commands.map((command, index) => (
          <CommandCard key={index} command={command} index={index} />
        ))}
      </div>
    </div>
  );
}
