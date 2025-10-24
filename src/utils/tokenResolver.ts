import { isAddress } from 'viem';

export interface TokenInfo {
  symbol: string;
  decimals: number;
  logo: string;
  contract: string | null;
  priceInUsd: number;
}

interface LayerSwapToken {
  symbol: string;
  contract: string | null;
  decimals: number;
  logo: string;
  price_in_usd: number;
}

interface LayerSwapNetwork {
  chain_id: string;
  tokens: LayerSwapToken[];
}

interface LayerSwapResponse {
  data: LayerSwapNetwork[];
}

// Cache for token data
const tokenCache = new Map<string, TokenInfo>();
let networksData: LayerSwapNetwork[] | null = null;
let fetchPromise: Promise<void> | null = null;

/**
 * Fetch token data from LayerSwap API
 */
async function fetchLayerSwapData(): Promise<void> {
  if (networksData) return; // Already loaded
  if (fetchPromise) return fetchPromise; // Already fetching

  fetchPromise = (async () => {
    try {
      const response = await fetch('https://api.layerswap.io/api/v2/networks', {
        headers: {
          'accept': 'application/json',
          'X-LS-APIKEY': 'osEFuC1/yKHfA25KtaNA5tLnN2DBfDEcQcHGK/aHkYYnQc1YlP3f1IzMMLQxr8CDTH8gGt44/DFAxDaxVv1anw'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch LayerSwap data');
      }

      const data: LayerSwapResponse = await response.json();
      networksData = data.data;

      // Build token cache
      for (const network of networksData) {
        for (const token of network.tokens) {
          const address = token.contract?.toLowerCase() || 'native';
          const key = `${network.chain_id}:${address}`;

          tokenCache.set(key, {
            symbol: token.symbol,
            decimals: token.decimals,
            logo: token.logo,
            contract: token.contract,
            priceInUsd: token.price_in_usd
          });

          // Also cache by address only for quick lookup
          if (token.contract) {
            tokenCache.set(token.contract.toLowerCase(), {
              symbol: token.symbol,
              decimals: token.decimals,
              logo: token.logo,
              contract: token.contract,
              priceInUsd: token.price_in_usd
            });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching LayerSwap data:', error);
      networksData = [];
    }
  })();

  return fetchPromise;
}

/**
 * Resolve token info by address
 */
export async function resolveToken(address: string, chainId?: string): Promise<TokenInfo | null> {
  // Ensure data is loaded
  await fetchLayerSwapData();

  // Handle native token (0x0000...0000)
  if (!address || address === '0x0000000000000000000000000000000000000000') {
    // Default to ETH for native token
    return {
      symbol: 'ETH',
      decimals: 18,
      logo: '',
      contract: null,
      priceInUsd: 0
    };
  }

  if (!isAddress(address)) {
    return null;
  }

  const lowerAddress = address.toLowerCase();

  // Try with chain ID first if provided
  if (chainId) {
    const key = `${chainId}:${lowerAddress}`;
    const token = tokenCache.get(key);
    if (token) return token;
  }

  // Fallback to address-only lookup
  return tokenCache.get(lowerAddress) || null;
}

/**
 * Get all networks data
 */
export async function getNetworksData(): Promise<LayerSwapNetwork[]> {
  await fetchLayerSwapData();
  return networksData || [];
}
