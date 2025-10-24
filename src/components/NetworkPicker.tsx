import { useEffect, useState } from 'react';
import { getNetworksData, type LayerSwapNetwork } from '../utils/tokenResolver';

interface NetworkPickerProps {
  selectedChainId: string | null;
  onNetworkChange: (chainId: string) => void;
}

export function NetworkPicker({ selectedChainId, onNetworkChange }: NetworkPickerProps) {
  const [networks, setNetworks] = useState<LayerSwapNetwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const loadNetworks = async () => {
      try {
        const data = await getNetworksData();
        // Filter for EVM networks and sort by display name
        const evmNetworks = data
          .filter((n) => n.type === 'evm')
          .sort((a, b) => a.display_name.localeCompare(b.display_name));
        setNetworks(evmNetworks);

        // Auto-select Ethereum mainnet (chain_id: "1") if available
        if (!selectedChainId && evmNetworks.length > 0) {
          const ethereum = evmNetworks.find((n) => n.chain_id === '1');
          if (ethereum) {
            onNetworkChange(ethereum.chain_id);
          } else {
            onNetworkChange(evmNetworks[0].chain_id);
          }
        }
      } catch (error) {
        console.error('Failed to load networks:', error);
      } finally {
        setLoading(false);
      }
    };

    loadNetworks();
  }, [selectedChainId, onNetworkChange]);

  const selectedNetwork = networks.find((n) => n.chain_id === selectedChainId);

  if (loading) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 p-3">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto relative">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Select Network
      </label>

      {/* Selected Network Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600
                   hover:border-gray-400 dark:hover:border-gray-500 transition-colors
                   p-3 flex items-center justify-between cursor-pointer"
      >
        {selectedNetwork ? (
          <div className="flex items-center gap-3">
            <img
              src={selectedNetwork.logo}
              alt={selectedNetwork.display_name}
              className="w-6 h-6 rounded-full"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <span className="text-gray-900 dark:text-white font-medium">
              {selectedNetwork.display_name}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              (Chain ID: {selectedNetwork.chain_id})
            </span>
          </div>
        ) : (
          <span className="text-gray-500 dark:text-gray-400">Select a network...</span>
        )}

        {/* Dropdown Arrow */}
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

          {/* Dropdown Content */}
          <div
            className="absolute z-20 w-full mt-2 bg-white dark:bg-gray-800 rounded-lg border
                       border-gray-300 dark:border-gray-600 shadow-lg max-h-96 overflow-y-auto"
          >
            {networks.map((network) => (
              <button
                key={network.chain_id}
                onClick={() => {
                  onNetworkChange(network.chain_id);
                  setIsOpen(false);
                }}
                className={`w-full p-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700
                           transition-colors text-left border-b border-gray-100 dark:border-gray-700
                           last:border-b-0 ${
                             network.chain_id === selectedChainId
                               ? 'bg-blue-50 dark:bg-blue-900/20'
                               : ''
                           }`}
              >
                <img
                  src={network.logo}
                  alt={network.display_name}
                  className="w-6 h-6 rounded-full"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="flex-1">
                  <div className="text-gray-900 dark:text-white font-medium">
                    {network.display_name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Chain ID: {network.chain_id}
                  </div>
                </div>
                {network.chain_id === selectedChainId && (
                  <svg
                    className="w-5 h-5 text-blue-600 dark:text-blue-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
