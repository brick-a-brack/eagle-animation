import { ALLOWED_LETTERS } from '@config-web';

export const generateRandomId = (length) => {
  const array = new Uint32Array(length);
  self.crypto.getRandomValues(array);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += ALLOWED_LETTERS[array[i] % ALLOWED_LETTERS.length];
  }
  return out;
};
