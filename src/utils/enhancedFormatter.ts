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
  tokenAddress?: string
): Promise<string> {
  let amountBigInt: bigint;

  // Handle BigNumber objects
  if (isBigNumberLike(amount)) {
    amountBigInt = bigNumberToBigInt(amount);
  } else if (typeof amount === 'string') {
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
    const tokenInfo = await resolveToken(tokenAddress);
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
      const formatted = await formatTokenAmount(value, contextToken);
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
          const itemResult = await formatValueEnhanced(item.name, item.value);
          parts.push(`${item.name}: ${itemResult.formatted}`);
        }
        return { formatted: parts.join('\n'), raw };
      }

      // Check if it's a path array
      if (value.every((item) => typeof item === 'object' && item && 'intermediateCurrency' in item)) {
        const pathDesc = await formatPath(value);
        return { formatted: pathDesc, raw };
      }

      return { formatted: `Array with ${value.length} items`, raw };
    }

    // Handle objects (like swap params)
    if (typeof value === 'object') {
      const obj = value as Record<string, any>;

      // Handle swap-like objects
      if ('currencyIn' in obj || 'currencyOut' in obj || 'path' in obj) {
        const formatted = await formatSwapObject(obj);
        return { formatted, raw };
      }

      return { formatted: 'Object', raw };
    }

    // Handle addresses
    if (typeof value === 'string' && value.startsWith('0x') && value.length === 42) {
      const tokenInfo = await resolveToken(value);
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
 * Format path array
 */
async function formatPath(path: any[]): Promise<string> {
  const steps: string[] = [];

  for (const hop of path) {
    if (hop.intermediateCurrency) {
      const token = await resolveToken(hop.intermediateCurrency);
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
async function formatSwapObject(obj: Record<string, any>): Promise<string> {
  const parts: string[] = [];

  try {
    // Currency In
    if (obj.currencyIn) {
      const token = await resolveToken(obj.currencyIn);
      const addr = obj.currencyIn === '0x0000000000000000000000000000000000000000' ? 'Native ETH' :
        `${obj.currencyIn.slice(0, 6)}...${obj.currencyIn.slice(-4)}`;
      parts.push(`From: ${token?.symbol || addr}`);
    }

    // Currency Out
    if (obj.currencyOut) {
      const token = await resolveToken(obj.currencyOut);
      const addr = obj.currencyOut === '0x0000000000000000000000000000000000000000' ? 'Native ETH' :
        `${obj.currencyOut.slice(0, 6)}...${obj.currencyOut.slice(-4)}`;
      parts.push(`To: ${token?.symbol || addr}`);
    }

    // Amount In
    if (obj.amountIn) {
      const formatted = await formatTokenAmount(obj.amountIn, obj.currencyIn);
      parts.push(`Amount In: ${formatted}`);
    }

    // Amount Out
    if (obj.amountOut) {
      const formatted = await formatTokenAmount(obj.amountOut, obj.currencyOut);
      parts.push(`Amount Out: ${formatted}`);
    }

    // Amount Out Minimum
    if (obj.amountOutMinimum) {
      const formatted = await formatTokenAmount(obj.amountOutMinimum, obj.currencyOut);
      parts.push(`Min Out: ${formatted}`);
    }

    // Path
    if (obj.path && Array.isArray(obj.path)) {
      const pathDesc = await formatPath(obj.path);
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
