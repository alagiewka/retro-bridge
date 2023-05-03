import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Logger } from '../common/logger';
import { BridgeService } from './bridge.service';
import { DiscordGateway } from '../discord/discord.gateway';
import { DiscordModule } from '../discord/discord.module';
import { TelnetModule } from '../telnet/telnet.module';
import { TelnetGateway } from '../telnet/telnet.gateway';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
    }),
    DiscordModule,
    TelnetModule,
  ],
  providers: [
    Logger,
    {
      provide: 'IMessageSource[]',
      inject: [DiscordGateway, TelnetGateway],
      useFactory: (discord: DiscordGateway, telnet: TelnetGateway) => [
        discord,
        telnet,
      ],
    },
    {
      provide: 'IMessageObserver[]',
      inject: [DiscordGateway, TelnetGateway],
      useFactory: (discord: DiscordGateway, telnet: TelnetGateway) => [
        discord,
        telnet,
      ],
    },
    BridgeService,
  ],
  exports: [],
})
export class BridgeModule {}
