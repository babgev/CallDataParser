import { useState } from 'react';
import type { ParsedCommand } from '../types';
import { formatValue } from '../utils/formatter';

interface CommandCardProps {
  command: ParsedCommand;
  index: number;
}

export function CommandCard({ command, index }: CommandCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden
                    bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
      <div
        className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-full
                           bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200
                           font-semibold text-sm">
              {index + 1}
            </span>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {command.commandName}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Type: {command.commandType}
              </p>
            </div>
          </div>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${
              expanded ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-750">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Parameters:
          </h4>
          <div className="space-y-3">
            {command.params.map((param, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium text-sm text-blue-600 dark:text-blue-400 min-w-fit">
                    {param.name}:
                  </span>
                  <span className="text-sm text-gray-900 dark:text-gray-100 break-all text-right">
                    {formatValue(param.name, param.value)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
