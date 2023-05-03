import { Injectable } from '@nestjs/common';
import {
  IMessage,
  IMessageObserver,
  IMessageSource,
} from '../common/message.interface';
import { createServer, Server, Socket } from 'net';
import { CompatibilityTable, Telnet, TelnetOption } from 'libtelnet-ts';
import { Logger } from '../common/logger';
import { ConfigService } from '@nestjs/config';
import { TelnetClientsManager } from './telnet-client.manager';
import { TelnetClientEvent } from './telnet.type';
import { ICommand, ICommandResult } from '../common/command.interface';

const TELNET_PORT = 'TELNET_PORT';

@Injectable()
export class TelnetGateway implements IMessageSource, IMessageObserver {
  private readonly messageObservers: IMessageObserver[];
  private readonly port;
  private isInitialized: boolean;
  private server: Server;
  private table: CompatibilityTable;

  constructor(
    private readonly logger: Logger,
    private readonly configService: ConfigService,
    private readonly telnetClientsManager: TelnetClientsManager,
  ) {
    logger.setContext(TelnetGateway.name);

    this.messageObservers = [];
    telnetClientsManager.setGateway(this);

    this.port = configService.get<number>(TELNET_PORT, 8023);
  }

  public readonly getName = (): string => TelnetGateway.name;

  public readonly isReady = (): boolean => {
    return false;
  };

  public readonly onMessage = async (
    origin: IMessageSource,
    message: IMessage,
  ): Promise<void> => {
    if (this.getName() === origin.getName()) return;

    await this.telnetClientsManager.dispatchMessage(message);
  };

  public readonly registerObserver = (observer: IMessageObserver): void => {
    this.messageObservers.push(observer);
  };

  public readonly sendMessage = async (message: IMessage): Promise<void> => {
    for (const observer of this.messageObservers) {
      try {
        await observer.onMessage(this, message);
      } catch (err) {
        this.logger.error(err.message, err.stack, 'sendMessage');
      }
    }
  };

  public readonly tick = async (): Promise<void> => {
    if (!this.isInitialized) {
      try {
        await this.initialize();
      } catch (err) {
        this.logger.error(err.message, err.stack, 'tick');
      }
    }
  };

  public readonly initialize = async (): Promise<void> => {
    if (this.isInitialized) return;
    this.server = createServer();

    this.server.on(TelnetClientEvent.Connection, this.handleSocketConnection);

    await Telnet.ready;

    this.table = CompatibilityTable.create()
      .support(TelnetOption.ECHO, true, false)
      .support(TelnetOption.LINEMODE, true, true)
      .finish();
    this.server.listen(this.port);
    this.isInitialized = true;

    this.logger.log(`Started telnet server on port: ${this.port}.`);
  };

  private readonly handleSocketConnection = (socket: Socket) => {
    this.telnetClientsManager.createTelnetClient(socket, this.table);
  };

  public readonly onCommand = async (): Promise<null> => null;

  public readonly sendCommand = async (
    command: ICommand,
  ): Promise<ICommandResult | null> => {
    for (const observer of this.messageObservers) {
      const response = await observer.onCommand(this, command);
      if (response) return response;
    }
    return null;
  };
}
