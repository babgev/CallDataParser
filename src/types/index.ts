export interface ParsedCommand {
  commandName: string;
  commandType: string;
  params: ParsedParam[];
}

export interface ParsedParam {
  name: string;
  value: any;
  type?: string;
}

export interface ParseResult {
  success: boolean;
  commands?: ParsedCommand[];
  error?: string;
}
