// Helper function to convert strings to ArrayBuffer and back
const encoder = new TextEncoder();
const decoder = new TextDecoder();

// Helper to convert ArrayBuffer to Base64
function ab_to_b64(ab: ArrayBuffer): string {
  return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(ab))));
}

// Helper to convert Base64 to ArrayBuffer
function b64_to_ab(b64: string): ArrayBuffer {
  const binary_string = atob(b64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

// Import the secret key for AES-GCM
async function getCryptoKey(secret: string): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('ai-gateway-salt'), // A static salt is fine here
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a plain-text string using AES-GCM.
 * The output is a Base64 string: "iv:ciphertext"
 */
export async function encrypt(text: string, secret: string): Promise<string> {
  const key = await getCryptoKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV
  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    encoder.encode(text)
  );

  // Combine IV and ciphertext for storage, separated by a colon
  return `${ab_to_b64(iv)}:${ab_to_b64(encrypted)}`;
}

/**
 * Decrypts an "iv:ciphertext" string using AES-GCM.
 */
export async function decrypt(encryptedText: string, secret: string): Promise<string> {
  const parts = encryptedText.split(':');
  if (parts.length !== 2) {
    throw new Error('Invalid encrypted text format. Expected "iv:ciphertext".');
  }

  const [iv_b64, encrypted_b64] = parts;
  const key = await getCryptoKey(secret);
  const iv = b64_to_ab(iv_b64);
  const encrypted = b64_to_ab(encrypted_b64);

  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    encrypted
  );

  return decoder.decode(decrypted);
}
