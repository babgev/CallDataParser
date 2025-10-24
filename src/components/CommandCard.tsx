import { useState, useEffect } from 'react';
import type { ParsedCommand } from '../types';
import { formatValue } from '../utils/formatter';
import { formatValueEnhanced } from '../utils/enhancedFormatter';

interface CommandCardProps {
  command: ParsedCommand;
  index: number;
  chainId: string | null;
}

interface EnhancedParam {
  name: string;
  value: any;
  formatted: string;
  raw: string;
}

export function CommandCard({ command, index, chainId }: CommandCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showRaw, setShowRaw] = useState<Record<number, boolean>>({});
  const [enhancedParams, setEnhancedParams] = useState<EnhancedParam[]>([]);
  const [loading, setLoading] = useState(false);

  const enhanceParams = async () => {
    setLoading(true);
    console.log('Starting enhancement for command:', command.commandName);
    try {
      const enhanced: EnhancedParam[] = [];

      for (const param of command.params) {
        try {
          console.log('Enhancing param:', param.name, 'value type:', typeof param.value);
          const result = await formatValueEnhanced(param.name, param.value, chainId);
          console.log('Enhanced result for', param.name, ':', result.formatted.substring(0, 100));
          enhanced.push({
            name: param.name,
            value: param.value,
            formatted: result.formatted,
            raw: result.raw
          });
        } catch (error) {
          console.error('Error formatting param:', param.name, error);
          // Fallback to raw format if enhancement fails
          enhanced.push({
            name: param.name,
            value: param.value,
            formatted: formatValue(param.name, param.value),
            raw: JSON.stringify(param.value, null, 2)
          });
        }
      }

      console.log('Enhanced params complete:', enhanced.length, 'params');
      setEnhancedParams(enhanced);
    } catch (error) {
      console.error('Error in enhanceParams:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (expanded) {
      enhanceParams();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded, chainId]);

  const toggleRaw = (idx: number) => {
    setShowRaw(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden
                    bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
      <div
        className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
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
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Parameters:
          </h4>

          {loading && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Loading token information...
            </div>
          )}

          <div className="space-y-3">
            {(enhancedParams.length > 0 ? enhancedParams : command.params.map(p => ({
              name: p.name,
              value: p.value,
              formatted: formatValue(p.name, p.value),
              raw: JSON.stringify(p.value, null, 2)
            }))).map((param, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-medium text-sm text-blue-600 dark:text-blue-400 min-w-fit">
                    {param.name}:
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleRaw(idx);
                      console.log('Toggle raw for', idx, ':', !showRaw[idx]);
                    }}
                    className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 dark:bg-gray-700
                             dark:hover:bg-gray-600 rounded text-gray-700 dark:text-gray-200
                             font-medium transition-colors"
                  >
                    {showRaw[idx] ? '📝 Formatted' : '🔍 Raw'}
                  </button>
                </div>

                {showRaw[idx] ? (
                  <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap
                                 break-all font-mono bg-gray-100 dark:bg-gray-900 p-2 rounded">
                    {param.raw}
                  </pre>
                ) : (
                  <div className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-all">
                    {param.formatted}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
