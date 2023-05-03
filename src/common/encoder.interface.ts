type EncodingOptions = Record<string, any>;

export interface IEncoder {
  encode(text: string, options?: EncodingOptions): Uint8Array;
  decode(bytes: Uint8Array, options?: EncodingOptions): string;
  name: string;
}
