import { Logger } from '../common/logger';
import { ConfigService } from '@nestjs/config';
import {
  BaseGuildTextChannel,
  Client,
  Events,
  IntentsBitField,
  Partials,
  Message,
  TextChannel,
} from 'discord.js';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { IChannel, IMessage } from '../common/message.interface';
import { DiscordGateway } from './discord.gateway';
import { channel } from 'diagnostics_channel';
import { ICommand, ICommandResult } from '../common/command.interface';

export const DISCORD_TOKEN = 'DISCORD_TOKEN';

@Injectable()
export class DiscordJsAdapter {
  private readonly token: string;

  private isConnected: boolean;
  private isConnecting: boolean;

  private gateway: DiscordGateway;
  private client: Client;

  constructor(
    private readonly logger: Logger,

    private readonly configService: ConfigService,
  ) {
    logger.setContext(DiscordJsAdapter.name);

    this.token = this.configService.get<string>(DISCORD_TOKEN, '');
    if (!this.token) throw Error('Discord bot access token undefined.');

    this.initializeClient();
  }

  public readonly setGateway = (gateway: DiscordGateway): void => {
    this.gateway = gateway;
  };

  private readonly initializeClient = (): void => {
    this.client = new Client({
      intents: [
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildMessageTyping,
        IntentsBitField.Flags.GuildMessageReactions,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.DirectMessages,
        IntentsBitField.Flags.DirectMessageReactions,
        IntentsBitField.Flags.DirectMessageTyping,
      ],
      partials: [Partials.Channel],
    });

    this.client.on(Events.ClientReady, (client: Client<true>) => {
      this.onConnectionReady(client);
    });
    this.client.on(Events.MessageCreate, async (message: Message<boolean>) => {
      await this.onMessage(message);
    });
    this.client.on(Events.ShardDisconnect, (errMsg, code) => {
      this.onDisconnect(errMsg, code);
    });
  };

  private readonly onConnectionReady = (client: Client<true>): void => {
    this.isConnected = true;
    this.isConnecting = false;
    const {
      user: { tag, id },
    } = this.client;
    this.logger.log(`Logged in as: ${tag} (${id})`);
  };

  private readonly onDisconnect = (errMsg, code): void => {
    this.isConnected = false;
    this.isConnecting = false;
    this.logger.error(`Bot disconnected, errMsg=${errMsg} (${code})`);
  };

  private readonly fetchNickname = async (
    discordMessage: Message<boolean>,
  ): Promise<string | null> => {
    try {
      const {
        guildId,
        author: { id },
      } = discordMessage;
      if (!guildId) return null;
      const guild = await this.client.guilds.fetch(guildId);
      if (!guild) return null;
      const { nickname } = await guild.members.fetch(id);

      return nickname || null;
    } catch (err) {
      this.logger.error(err.message, err.stack, 'fetchNickname');
    }
  };

  private async onMessage(discordMessage: Message<boolean>): Promise<void> {
    const {
      user: { id: ownId },
    } = this.client;
    const {
      author: { id: senderId, username },
      content,
      channelId,
    } = discordMessage;

    if (senderId === ownId) {
      this.logger.debug(`${JSON.stringify(discordMessage)}`);
      return;
    }

    const nickname = await this.fetchNickname(discordMessage);

    const channels = this.getChannels();
    const matchingChannel = channels.find((c) => c.channelId === channelId);
    const channelName = matchingChannel ? matchingChannel.channelName : '';

    try {
      await this.gateway.sendMessage({
        senderName: nickname || username,
        senderId,
        content,
        channel: { channelId, channelName },
        source: this.gateway.getName(),
      });
    } catch (err) {
      this.logger.error(err.message, err.stack, 'onMessage');
    }
  }

  public readonly connect = async (elapsed: number): Promise<void> => {
    if (!this.token)
      throw new UnauthorizedException(
        `Cannot connect, discord token is unset. Please check DISCORD_TOKEN env variable. (elapsed: ${elapsed})`,
      );
    this.isConnecting = true;
    await this.client.login(this.token);
  };

  public readonly sendChannelMessage = async (
    message: IMessage,
  ): Promise<void> => {
    const {
      senderName,
      channel: { channelId },
      content,
    } = message;
    const channel = await this.client.channels.fetch(channelId);
    if (channel instanceof BaseGuildTextChannel) {
      const member = await channel.guild.members.fetch(this.client.user.id);
      await member.setNickname(senderName);

      await channel.send(content);

      await member.setNickname(null);
    } else {
      this.logger.warn(
        `Channel ${channelId} not found, attempting to send a DM`,
      );
      await this.sendDirectMessage(message);
    }
  };

  private readonly sendDirectMessage = async (
    message: IMessage,
  ): Promise<void> => {
    const {
      channel: { channelId },
      senderName,
      content,
    } = message;

    const user = await this.client.users.fetch(channelId);

    if (!user)
      this.logger.error(
        `User ${channelId} not found.`,
        '',
        'sendDirectMessage',
      );

    const directMessage = await user.createDM();

    if (!directMessage)
      this.logger.error(
        `Couldn't create a DM to User ${channelId}`,
        '',
        'sendDirectMessage',
      );

    await directMessage.send(`${senderName}: ${content}`);
  };

  public readonly tick = async (elapsed: number): Promise<void> => {
    if (!this.isConnected && !this.isConnecting) await this.connect(elapsed);
  };

  public readonly isReady = (): boolean => this.isConnected;

  private readonly getChannels = (): IChannel[] => {
    const channels = this.client.channels.cache.entries();

    const textChannels: IChannel[] = [];

    for (const [key, value] of channels) {
      if (value instanceof TextChannel)
        textChannels.push({ channelId: key, channelName: value.name });
    }

    return textChannels;
  };

  public readonly handleListChannels = async (
    command: ICommand,
  ): Promise<ICommandResult | null> => {
    const { args } = command;
    const channelArray = this.getChannels();
    const channels: Record<string, string> = {};

    for (const { channelId, channelName } of channelArray) {
      channels[channelName] = channelId;
    }

    if (!args || !args.length) {
      const message = Object.keys(channels).join('\r');
      return {
        command,
        message,
        handled: true,
        properties: channels,
      };
    }

    const matchingKey = Object.keys(channels).find((k) => k.startsWith(args));
    const matching = channels[matchingKey];

    return {
      command,
      handled: !!matching,
      message: `${matching ? 'Channel found.' : 'No such channel found.'}`,
      properties: {
        channelId: matching,
        channelName: args,
      },
    };
  };
}
