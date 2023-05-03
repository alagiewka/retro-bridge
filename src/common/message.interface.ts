import { ICommand, ICommandResult } from './command.interface';

export interface IMessage {
  senderId: string;
  senderName: string;
  channel: IChannel;
  content: string;
  source: string;
}

export interface IMessageSource {
  getName(): string;
  sendMessage(message: IMessage): Promise<void>;
  registerObserver(observer: IMessageObserver): void;
  tick(elapsed: number): Promise<void>;
  isReady(): boolean;
}

export interface IChannel {
  channelId: string;
  channelName: string;
}

export interface IMessageObserver {
  onMessage(origin: IMessageSource, message: IMessage): Promise<void>;
  onCommand(
    origin: IMessageSource,
    command: ICommand,
  ): Promise<ICommandResult | null>;
}
