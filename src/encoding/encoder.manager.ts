import { Inject, Injectable } from '@nestjs/common';
import { IEncoder } from '../common/encoder.interface';

@Injectable()
export class EncoderManager {
  constructor(@Inject('IEncoder[]') private readonly encoders: IEncoder[]) {}

  public getEncoder(name: string): IEncoder {
    for (const encoder of this.encoders) {
      if (encoder.name === name) return encoder;
    }
    throw new Error(`${name} encoding not supported.`);
  }
}
