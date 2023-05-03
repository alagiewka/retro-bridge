import { Socket } from 'net';
import { randomUUID } from 'crypto';
import {
  CompatibilityTable,
  IDataEvent,
  Telnet,
  TelnetFlag,
} from 'libtelnet-ts';
import { Buffer } from 'buffer';
import { Logger } from '../common/logger';
import { TelnetClientsManager } from './telnet-client.manager';
import { IChannel, IMessage } from '../common/message.interface';
import { appendBuffers, buf2hex, bufSplitLine } from './telnet.util';
import { TelnetClientEvent } from './telnet.type';
import { IEncoder } from '../common/encoder.interface';
import {
  COMMAND_TOKEN,
  ICommand,
  parseCommand,
} from '../common/command.interface';

export class TelnetClient {
  private readonly uuid: string;
  private readonly telnet: Telnet;
  private readonly logger: Logger;

  private nickname: string;
  private channel: IChannel;
  private inputBuffer: Uint8Array;
  private encoder: IEncoder;

  constructor(
    private readonly parent: TelnetClientsManager,
    private readonly socket: Socket,
    private readonly table: CompatibilityTable,
  ) {
    this.uuid = randomUUID();

    this.logger = new Logger(`${TelnetClient.name}-${this.uuid}`);

    this.telnet = new Telnet(table, TelnetFlag.NONE);

    socket.on(TelnetClientEvent.Data, this.handleSocketData);
    this.telnet.on(TelnetClientEvent.Send, this.handleSend);
    this.telnet.on(TelnetClientEvent.Data, this.handleTelnetData);
    socket.on(TelnetClientEvent.Close, this.handleSocketClose);

    this.logger.debug(`New telnet client connected with id ${this.uuid}.`);

    this.sendWelcome();
  }

  public readonly getId = (): string => this.uuid;
  public readonly getNickname = (): string => this.nickname || this.uuid;
  public readonly getCurrentChannel = (): IChannel => this.channel;

  private readonly handleSend = (event: IDataEvent) => {
    this.socket.write(event.buffer);
  };

  private readonly handleSocketData = (bytes?: Buffer) => {
    this.telnet.receive(bytes);
  };

  private readonly handleTelnetData = ({ buffer }: IDataEvent) => {
    this.inputBuffer = appendBuffers(this.inputBuffer, buffer);
    try {
      this.processBuffer();
    } catch (err) {
      this.logger.error(err.message, err.stack, 'handleTelnetData');
    }

    this.telnet.send(buffer);
  };

  private readonly isCurrentChannel = (channelId: string): boolean =>
    this.channel && this.channel.channelId === channelId;

  public readonly sendMessage = (message: Partial<IMessage>): void => {
    const { channel, senderName, content } = message;

    const channelPart =
      !channel || this.isCurrentChannel(channel.channelId)
        ? ''
        : `[C:${channel.channelName}]`;

    const text = `${channelPart}${senderName}: ${content}\r`;
    this.logger.debug(`Message sent to telnet client ${this.uuid}: ${text}`);
    try {
      this.telnet.send(
        this.encoder ? this.encoder.encode(text) : Buffer.from(text),
      );
    } catch (err) {
      this.logger.error(err.message, err.stack, 'sendMessage');
    }
  };

  private readonly handleSocketClose = () => {
    this.telnet.dispose();
    this.parent.removeClient(this);
    this.logger.debug(`Client id ${this.uuid} disconnected.`);
  };

  private readonly sendWelcome = (): void => {
    this.encoder = this.parent.getEncoder('petscii');

    this.sendMessage({
      senderName: 'RetroBridge',
      content: 'Welcome to RetroBridge, please type in your nickname:',
    });
  };

  private readonly handleNickname = (nickname: string): void => {
    this.nickname = nickname;
    this.sendMessage({
      senderName: 'RetroBridge',
      content: `Your nickname was set to ${nickname}`,
    });
  };

  private readonly processBuffer = (): void => {
    const { line, remaining } = bufSplitLine(this.inputBuffer, 13);
    if (!line) return;

    this.inputBuffer = remaining;

    const bytes = Buffer.from(line);
    const decoded = this.encoder
      ? this.encoder.decode(bytes)
      : bytes.toString();
    this.logger.debug(`Decoded line: ${decoded} [${buf2hex(line)}]`);

    this.handleMessage(decoded);
  };

  private readonly handleMessage = (message: string) => {
    if (!this.nickname) return this.handleNickname(message);

    const command = parseCommand(message);
    if (command) return this.handleCommand(command).then();

    if (!this.channel) return this.sendHelp();

    this.parent.handleClientMessage(this, message).then();
  };

  private readonly handleCommand = async (command: ICommand): Promise<void> => {
    switch (command.name) {
      case 'q':
        this.socket.end();
        return;
      case 'l':
        const channels = await this.parent.handleClientCommand(this, command);
        if (!channels) this.sendHelp();
        this.sendMessage({
          senderName: 'RetroBridge',
          content: channels.message,
        });
        return;
      case 'c':
        const response = await this.parent.handleClientCommand(this, command);
        if (response && response.handled)
          this.channel = {
            channelId: response.properties['channelId'],
            channelName: response.properties['channelName'],
          };
        return;
      case 'n':
        if (command.args && command.args.length) {
          this.nickname = command.args;
          this.sendMessage({
            senderName: 'RetroBridge',
            content: `Nickname changed to ${command.args}`,
          });
          return;
        }
        this.sendHelp();
        return;
      default:
        this.sendHelp();
        return;
    }
  };

  private readonly sendHelp = (): void => {
    this.sendMessage({
      senderName: 'RetroBridge',
      content: `Current channel: ${
        this.channel ? this.channel.channelName : '[not selected]'
      }. Your nickname is ${
        this.nickname
      }. To display channels type '${COMMAND_TOKEN}l'.\rTo select a channel type '${COMMAND_TOKEN}c [channel name]'.\rTo change nickname type '${COMMAND_TOKEN}n [nickname]'.\rTo quit type '${COMMAND_TOKEN}q'`,
    });
  };
}
