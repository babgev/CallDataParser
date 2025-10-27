import { formatUnits } from 'viem';
import { resolveToken } from './tokenResolver';

interface BigNumberLike {
  type?: string;
  hex?: string;
  _hex?: string;
}

/**
 * Check if value is a BigNumber-like object
 */
function isBigNumberLike(value: unknown): value is BigNumberLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    ('hex' in value || '_hex' in value) &&
    ('type' in value ? (value as any).type === 'BigNumber' : true)
  );
}

// Special value indicating to use contract balance
const CONTRACT_BALANCE = '0x8000000000000000000000000000000000000000000000000000000000000000';

/**
 * Convert BigNumber hex to bigint
 */
function bigNumberToBigInt(bn: BigNumberLike): bigint {
  const hex = bn.hex || bn._hex;
  if (!hex) return 0n;
  return BigInt(hex);
}

/**
 * Format amount with token info
 */
export async function formatTokenAmount(
  amount: string | bigint | BigNumberLike,
  tokenAddress?: string,
  chainId?: string | null
): Promise<string> {
  // Handle BigNumber objects - check for CONTRACT_BALANCE first
  if (isBigNumberLike(amount)) {
    const hex = (amount as any).hex || (amount as any)._hex;
    if (hex === CONTRACT_BALANCE) {
      return 'CONTRACT_BALANCE (use all from previous step)';
    }
  }

  let amountBigInt: bigint;

  // Convert to bigint
  if (isBigNumberLike(amount)) {
    amountBigInt = bigNumberToBigInt(amount);
  } else if (typeof amount === 'string') {
    if (amount === CONTRACT_BALANCE) {
      return 'CONTRACT_BALANCE (use all from previous step)';
    }
    try {
      amountBigInt = BigInt(amount);
    } catch {
      return amount;
    }
  } else {
    amountBigInt = amount;
  }

  // Try to resolve token info
  if (tokenAddress) {
    const tokenInfo = await resolveToken(tokenAddress, chainId || undefined);
    if (tokenInfo) {
      const formatted = formatUnits(amountBigInt, tokenInfo.decimals);
      const parts = formatted.split('.');
      const wholePart = parts[0];
      const decimalPart = parts[1] || '';

      // Limit decimals to 6 significant digits
      const limitedDecimal = decimalPart.slice(0, 6);
      const displayAmount = limitedDecimal ? `${wholePart}.${limitedDecimal}` : wholePart;

      return `${displayAmount} ${tokenInfo.symbol}`;
    }
  }

  // Fallback: format with 18 decimals (ETH default)
  const formatted = formatUnits(amountBigInt, 18);
  return `${formatted} tokens`;
}

/**
 * Enhanced value formatter that handles complex swap structures
 */
export async function formatValueEnhanced(
  _name: string,
  value: unknown,
  chainId?: string | null,
  contextToken?: string
): Promise<{ formatted: string; raw: string }> {
  const raw = JSON.stringify(value, null, 2);

  try {
    // Handle null/undefined
    if (value === null || value === undefined) {
      return { formatted: 'null', raw: 'null' };
    }

    // Handle BigNumber amounts
    if (isBigNumberLike(value)) {
      const formatted = await formatTokenAmount(value, contextToken, chainId);
      return { formatted, raw };
    }

    // Handle arrays
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return { formatted: '[]', raw: '[]' };
      }

      // Check if it's a V4 command parameter array (array of objects with name/value)
      if (value.every((item) => typeof item === 'object' && item && 'name' in item && 'value' in item)) {
        const parts: string[] = [];
        for (const item of value) {
          const itemResult = await formatValueEnhanced(item.name, item.value, chainId);
          parts.push(`${item.name}: ${itemResult.formatted}`);
        }
        return { formatted: parts.join('\n'), raw };
      }

      // Check if it's a V2 path array (array of token addresses)
      if (value.every((item) => typeof item === 'string' && item.startsWith('0x') && item.length === 42)) {
        const pathDesc = await formatV2Path(value, chainId);
        return { formatted: pathDesc, raw };
      }

      // Check if it's a V3 path array (array of objects with tokenIn/tokenOut/fee)
      if (value.every((item) => typeof item === 'object' && item && 'tokenIn' in item && 'tokenOut' in item)) {
        const pathDesc = await formatV3Path(value, chainId);
        return { formatted: pathDesc, raw };
      }

      // Check if it's a V4 path array (array of objects with intermediateCurrency)
      if (value.every((item) => typeof item === 'object' && item && 'intermediateCurrency' in item)) {
        const pathDesc = await formatV4Path(value, chainId);
        return { formatted: pathDesc, raw };
      }

      return { formatted: `Array with ${value.length} items`, raw };
    }

    // Handle objects (like swap params)
    if (typeof value === 'object') {
      const obj = value as Record<string, any>;

      // Handle swap-like objects
      if ('currencyIn' in obj || 'currencyOut' in obj || 'path' in obj) {
        const formatted = await formatSwapObject(obj, chainId);
        return { formatted, raw };
      }

      return { formatted: 'Object', raw };
    }

    // Handle addresses
    if (typeof value === 'string' && value.startsWith('0x') && value.length === 42) {
      const tokenInfo = await resolveToken(value, chainId || undefined);
      if (tokenInfo) {
        return {
          formatted: `${tokenInfo.symbol} (${value.slice(0, 6)}...${value.slice(-4)})`,
          raw: value
        };
      }
      return {
        formatted: `${value.slice(0, 6)}...${value.slice(-4)}`,
        raw: value
      };
    }

    // Default
    return { formatted: String(value), raw: String(value) };
  } catch (error) {
    console.error('Error in formatValueEnhanced:', error);
    return { formatted: 'Error formatting value', raw };
  }
}

/**
 * Format V2 path array (simple array of token addresses)
 */
async function formatV2Path(path: string[], chainId?: string | null): Promise<string> {
  const tokens: string[] = [];

  for (const address of path) {
    const token = await resolveToken(address, chainId || undefined);
    tokens.push(token?.symbol || `${address.slice(0, 6)}...${address.slice(-4)}`);
  }

  return tokens.join(' → ');
}

/**
 * Format V3 path array (array of {tokenIn, tokenOut, fee} objects)
 */
async function formatV3Path(path: any[], chainId?: string | null): Promise<string> {
  if (path.length === 0) return '';

  const steps: string[] = [];

  // Add first token
  const firstHop = path[0];
  const firstToken = await resolveToken(firstHop.tokenIn, chainId || undefined);
  steps.push(firstToken?.symbol || `${firstHop.tokenIn.slice(0, 6)}...${firstHop.tokenIn.slice(-4)}`);

  // Add each hop
  for (const hop of path) {
    const token = await resolveToken(hop.tokenOut, chainId || undefined);
    const symbol = token?.symbol || `${hop.tokenOut.slice(0, 6)}...${hop.tokenOut.slice(-4)}`;
    const fee = hop.fee ? ` (${hop.fee / 10000}%)` : '';
    steps.push(`→${fee} ${symbol}`);
  }

  return steps.join(' ');
}

/**
 * Format V4 path array (array with intermediateCurrency)
 */
async function formatV4Path(path: any[], chainId?: string | null): Promise<string> {
  const steps: string[] = [];

  for (const hop of path) {
    if (hop.intermediateCurrency) {
      const token = await resolveToken(hop.intermediateCurrency, chainId || undefined);
      const symbol = token?.symbol || 'Unknown';
      const fee = hop.fee ? ` (${hop.fee / 10000}%)` : '';
      steps.push(`→ ${symbol}${fee}`);
    }
  }

  return steps.join(' ');
}

/**
 * Format swap object
 */
async function formatSwapObject(obj: Record<string, any>, chainId?: string | null): Promise<string> {
  const parts: string[] = [];

  try {
    // Extract output token from path if available
    let outputToken: string | undefined;
    if (obj.path && Array.isArray(obj.path) && obj.path.length > 0) {
      // For V4, the intermediateCurrency is the output token
      outputToken = obj.path[0].intermediateCurrency;
    }

    // Currency In
    if (obj.currencyIn) {
      const token = await resolveToken(obj.currencyIn, chainId || undefined);
      const addr = obj.currencyIn === '0x0000000000000000000000000000000000000000' ? 'Native ETH' :
        `${obj.currencyIn.slice(0, 6)}...${obj.currencyIn.slice(-4)}`;
      parts.push(`From: ${token?.symbol || addr}`);
    }

    // Currency Out
    if (obj.currencyOut) {
      const token = await resolveToken(obj.currencyOut, chainId || undefined);
      const addr = obj.currencyOut === '0x0000000000000000000000000000000000000000' ? 'Native ETH' :
        `${obj.currencyOut.slice(0, 6)}...${obj.currencyOut.slice(-4)}`;
      parts.push(`To: ${token?.symbol || addr}`);
      outputToken = obj.currencyOut; // Use currencyOut if available
    }

    // Amount In
    if (obj.amountIn) {
      const formatted = await formatTokenAmount(obj.amountIn, obj.currencyIn, chainId);
      parts.push(`Amount In: ${formatted}`);
    }

    // Amount Out
    if (obj.amountOut) {
      const formatted = await formatTokenAmount(obj.amountOut, outputToken || obj.currencyOut, chainId);
      parts.push(`Amount Out: ${formatted}`);
    }

    // Amount Out Minimum
    if (obj.amountOutMinimum) {
      const formatted = await formatTokenAmount(obj.amountOutMinimum, outputToken || obj.currencyOut, chainId);
      parts.push(`Min Out: ${formatted}`);
    }

    // Path
    if (obj.path && Array.isArray(obj.path)) {
      const pathDesc = await formatV4Path(obj.path, chainId);
      if (pathDesc) {
        parts.push(`Path: ${pathDesc}`);
      }
    }

    return parts.length > 0 ? parts.join('\n') : 'Swap Details';
  } catch (error) {
    console.error('Error formatting swap object:', error);
    return 'Error formatting swap details';
  }
}
