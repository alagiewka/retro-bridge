import { Module } from '@nestjs/common';
import { DiscordJsAdapter } from './discord-js.adapter';
import { DiscordGateway } from './discord.gateway';
import { Logger } from '../common/logger';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
    }),
  ],
  providers: [Logger, DiscordJsAdapter, DiscordGateway],
  exports: [DiscordGateway],
})
export class DiscordModule {}
