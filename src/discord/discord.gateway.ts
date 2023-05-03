import {
  IMessage,
  IMessageObserver,
  IMessageSource,
} from '../common/message.interface';
import { Logger } from '../common/logger';
import { DiscordJsAdapter } from './discord-js.adapter';
import { Injectable } from '@nestjs/common';
import {ICommand, ICommandResult} from '../common/command.interface';

@Injectable()
export class DiscordGateway implements IMessageSource, IMessageObserver {
  private readonly messageObservers: IMessageObserver[];

  constructor(
    private readonly logger: Logger,
    private readonly discordAdapter: DiscordJsAdapter,
  ) {
    logger.setContext(DiscordGateway.name);
    this.discordAdapter.setGateway(this);
    this.messageObservers = [];
  }

  public readonly getName = (): string => DiscordGateway.name;

  public readonly isReady = (): boolean => false;

  public readonly registerObserver = (observer: IMessageObserver): void => {
    this.messageObservers.push(observer);
  };

  public readonly sendMessage = async (message: IMessage): Promise<void> => {
    for (const observer of this.messageObservers) {
      try {
        await observer.onMessage(this, message);
        this.logger.debug(
          `[${this.getName()}] Message sent:\n ${JSON.stringify(message)}`,
        );
      } catch (err) {
        this.logger.error(err.message, err.stack, 'sendMessage');
      }
    }
  };

  public readonly tick = async (elapsed: number): Promise<void> => {
    if (!this.discordAdapter.isReady())
      await this.discordAdapter.connect(elapsed);
  };

  public readonly onMessage = async (
    origin: IMessageSource,
    message: IMessage,
  ): Promise<void> => {
    if (origin.getName() === this.getName()) return;

    await this.discordAdapter.sendChannelMessage(message);
  };

  public readonly onCommand = async (
    origin: IMessageSource,
    command: ICommand,
  ): Promise<ICommandResult | null> => {
    if (origin.getName() === this.getName()) return null;

    switch (command.name) {
      case 'c':
      case 'l':
        return this.discordAdapter.handleListChannels(command);
      default:
        return null;
    }
  };
}
