export const appendBuffers = (
  first: Uint8Array,
  second: Uint8Array,
): Uint8Array => {
  if (!first) return second;
  const result = new Uint8Array(first.length + second.length);
  result.set(first);
  result.set(second, first.length);
  return result;
};

export const buf2hex = (buffer: Uint8Array): string => {
  return [...new Uint8Array(buffer)]
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('');
};

const findFirstBytePosition = (
  haystack: Uint8Array,
  needle: number | number[],
): number | null => {
  for (let i = 0; i < haystack.length; i++) {
    if (
      (Array.isArray(needle) && needle.includes(haystack.at(i))) ||
      haystack.at(i) === needle
    )
      return i;
  }
  return null;
};

const applyBackspace = (buffer: Uint8Array): Uint8Array => {
  const bytes: number[] = [];
  let charsToRemove = 0;
  for (let i = buffer.length - 1; i >= 0; i--) {
    const current = buffer[i];
    if (current === 20) charsToRemove++;
    else {
      if (charsToRemove > 0) {
        charsToRemove--;
      } else {
        bytes.push(current);
      }
    }
  }
  return Uint8Array.from(bytes.reverse());
};

export const bufSplitLine = (
  buffer: Uint8Array,
  delimiters: number | number[] = 13,
): { line?: Uint8Array; remaining: Uint8Array } => {
  const splitAt = findFirstBytePosition(buffer, delimiters);
  if (!splitAt) return { remaining: buffer };
  return {
    line: applyBackspace(buffer.slice(0, splitAt)),
    remaining: buffer.slice(splitAt + 1, buffer.length),
  };
};
