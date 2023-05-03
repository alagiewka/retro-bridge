import { Module } from '@nestjs/common';
import { Logger } from '../common/logger';
import { ConfigModule } from '@nestjs/config';
import { TelnetGateway } from './telnet.gateway';
import { EncodingModule } from '../encoding/encoding.module';
import { TelnetClientsManager } from './telnet-client.manager';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
    }),
    EncodingModule,
  ],
  providers: [Logger, TelnetClientsManager, TelnetGateway],
  exports: [TelnetGateway],
})
export class TelnetModule {}
