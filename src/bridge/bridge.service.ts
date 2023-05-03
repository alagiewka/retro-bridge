import { Inject, Injectable } from '@nestjs/common';
import {
  IMessage,
  IMessageObserver,
  IMessageSource,
} from '../common/message.interface';
import { Logger } from '../common/logger';
import { Cron } from '@nestjs/schedule';
import { ICommand, ICommandResult } from '../common/command.interface';

@Injectable()
export class BridgeService implements IMessageObserver {
  private exit: boolean;
  private readonly start: number;

  constructor(
    private readonly logger: Logger,
    @Inject('IMessageSource[]')
    private readonly messageSources: IMessageSource[],
    @Inject('IMessageObserver[]')
    private readonly messageObservers: IMessageObserver[],
  ) {
    this.start = Date.now();
    this.exit = false;
    this.logger.setContext(BridgeService.name);
    for (const source of this.messageSources) {
      source.registerObserver(this);
    }
    this.logger.log('Starting bot application.');
  }

  public readonly onMessage = async (
    origin: IMessageSource,
    message: IMessage,
  ): Promise<void> => {
    this.logger.debug(`[${origin.getName()}]: ${JSON.stringify(message)}`);

    for (const observer of this.messageObservers) {
      try {
        await observer.onMessage(origin, message);
      } catch (error) {
        this.logger.error(error.message, error.stack, 'onMessage');
      }
    }
  };

  public readonly onCommand = async (
    origin: IMessageSource,
    command: ICommand,
  ): Promise<ICommandResult | null> => {
    this.logger.debug(`[${origin.getName()}] ${JSON.stringify(command)}`);

    for (const observer of this.messageObservers) {
      const reponse = await observer.onCommand(origin, command);
      if (reponse) return reponse;
    }
    return null;
  };

  @Cron('* * * * * *')
  public async tick(): Promise<void> {
    for (const source of this.messageSources) {
      await source.tick(Date.now() - this.start);
    }
  }
}
