import { isAddress, formatUnits } from 'viem';

/**
 * Format an Ethereum address for display
 */
export function formatAddress(address: string): string {
  if (!isAddress(address)) {
    return address;
  }

  // Special addresses
  if (address === '0x0000000000000000000000000000000000000000') {
    return 'ETH (Native)';
  }
  if (address === '0x0000000000000000000000000000000000000001') {
    return 'MSG_SENDER';
  }
  if (address === '0x0000000000000000000000000000000000000002') {
    return 'ROUTER_ADDRESS';
  }

  // Truncate address: 0x1234...5678
  const start = address.slice(0, 6);
  const end = address.slice(-4);
  return start + '...' + end;
}

/**
 * Format a Wei amount to a readable decimal string
 */
export function formatAmount(amount: string | bigint, decimals: number = 18): string {
  try {
    const value = typeof amount === 'string' ? BigInt(amount) : amount;
    return formatUnits(value, decimals);
  } catch {
    return amount.toString();
  }
}

/**
 * Format a value based on its type and name
 */
export function formatValue(name: string, value: unknown): string {
  // Handle different types
  if (value === null || value === undefined) {
    return 'null';
  }

  // Arrays
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';

    // Check if it's a path (array of addresses)
    if (value.every((item) => typeof item === 'string' && item.startsWith('0x'))) {
      return value.map(addr => formatAddress(addr as string)).join(' → ');
    }

    return '[' + value.map(v => formatValue(name, v)).join(', ') + ']';
  }

  // Addresses
  if (typeof value === 'string' && value.startsWith('0x') && value.length === 42) {
    return formatAddress(value);
  }

  // Amounts (big integers or numeric strings)
  if (name.toLowerCase().includes('amount') || name.toLowerCase().includes('value')) {
    if (typeof value === 'string' && /^\d+$/.test(value)) {
      const formatted = formatAmount(value);
      return formatted + ' (' + value + ' Wei)';
    }
    if (typeof value === 'bigint') {
      const formatted = formatAmount(value);
      return formatted + ' (' + value.toString() + ' Wei)';
    }
  }

  // Booleans
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  // Objects
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }

  // Default: convert to string
  return String(value);
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
