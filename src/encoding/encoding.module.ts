import { Module } from '@nestjs/common';
import { EncoderManager } from './encoder.manager';
import { PetsciiEncoder } from './encoders/petscii.encoder';

@Module({
  imports: [],
  providers: [
    PetsciiEncoder,
    {
      provide: 'IEncoder[]',
      inject: [PetsciiEncoder],
      useFactory: (petscii: PetsciiEncoder) => [petscii],
    },
    EncoderManager,
  ],
  exports: [EncoderManager],
})
export class EncodingModule {}
