import { Injectable } from '@nestjs/common';
import { TelnetClient } from './telnet.client';
import { IMessage } from '../common/message.interface';
import { EncoderManager } from '../encoding/encoder.manager';
import { IEncoder } from '../common/encoder.interface';
import { TelnetGateway } from './telnet.gateway';
import { Socket } from 'net';
import { CompatibilityTable } from 'libtelnet-ts';
import { ICommand, ICommandResult } from '../common/command.interface';

@Injectable()
export class TelnetClientsManager {
  private clients: TelnetClient[];
  private gateway: TelnetGateway;

  constructor(private readonly encoderManager: EncoderManager) {
    this.clients = [];
  }

  public readonly setGateway = (gateway: TelnetGateway): void => {
    this.gateway = gateway;
  };

  public readonly removeClient = (telnetClient: TelnetClient): void => {
    this.clients = this.clients.filter(
      (c) => c.getId() !== telnetClient.getId(),
    );
  };

  public readonly createTelnetClient = (
    socket: Socket,
    table: CompatibilityTable,
  ): void => {
    const client = new TelnetClient(this, socket, table);
    this.clients.push(client);
  };

  public readonly dispatchMessage = async (
    message: IMessage,
  ): Promise<void> => {
    this.clients.forEach((c) => c.sendMessage(message));
  };

  public readonly getEncoder = (name: string): IEncoder =>
    this.encoderManager.getEncoder(name);

  public readonly handleClientMessage = async (
    origin: TelnetClient,
    content: string,
  ): Promise<void> => {
    await this.gateway.sendMessage({
      source: this.gateway.getName(),
      senderName: origin.getNickname(),
      senderId: '',
      channel: origin.getCurrentChannel(),
      content,
    });
  };

  public readonly handleClientCommand = async (
    origin: TelnetClient,
    command: ICommand,
  ): Promise<ICommandResult | null> => {
    return this.gateway.sendCommand(command);
  };
}
