import { Injectable } from '@nestjs/common';
import { IEncoder } from '../../common/encoder.interface';
import { PETSCII } from 'petscii';

@Injectable()
export class PetsciiEncoder implements IEncoder {
  public readonly name = 'petscii';

  public readonly decode = (bytes: Uint8Array): string =>
    PETSCII.decode('shifted', bytes);

  public readonly encode = (text: string): Uint8Array =>
    PETSCII.encode('shifted', text);
}
