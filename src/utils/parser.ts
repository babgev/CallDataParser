import { CommandParser } from '@uniswap/universal-router-sdk';
import type { ParseResult, ParsedCommand } from '../types';

/**
 * Parse Universal Router calldata using the official Uniswap SDK
 */
export function parseCalldata(calldata: string): ParseResult {
  try {
    // Validate input
    if (!calldata || !calldata.startsWith('0x')) {
      return {
        success: false,
        error: 'Invalid calldata: must start with 0x',
      };
    }

    // Parse using Uniswap SDK
    const parsed = CommandParser.parseCalldata(calldata);

    // Transform to our format
    const commands: ParsedCommand[] = parsed.commands.map((cmd) => ({
      commandName: cmd.commandName,
      commandType: cmd.commandType.toString(),
      params: cmd.params.map((param) => ({
        name: param.name,
        value: param.value,
        type: typeof param.value,
      })),
    }));

    return {
      success: true,
      commands,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
