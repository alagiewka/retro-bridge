export interface ICommand {
  name: string;
  args: string;
}

export function parseCommand(content: string): ICommand | null {
  if (!isCommand(content)) return null;
  const tmpMessage = content.substring(COMMAND_TOKEN.length);
  const name = tmpMessage.split(' ')[0].toLowerCase();
  const args = tmpMessage.substring(name.length + 1);

  return { name, args };
}

function isCommand(message: string): boolean {
  return message.substring(0, COMMAND_TOKEN.length) === COMMAND_TOKEN;
}

export const COMMAND_TOKEN = '←';

export interface ICommandResult {
  command: ICommand;
  handled: boolean;
  message: string;
  properties: Record<string, string>;
}
