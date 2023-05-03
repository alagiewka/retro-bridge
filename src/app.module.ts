import { Module } from '@nestjs/common';
import { BridgeModule } from './bridge/bridge.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
    }),
    BridgeModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
