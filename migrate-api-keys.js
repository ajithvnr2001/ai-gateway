// Migration script to encrypt existing plain-text API keys
// Run with: node migrate-api-keys.js

const crypto = require('crypto');

// Helper functions matching crypto.ts
function ab_to_b64(ab) {
  return Buffer.from(ab).toString('base64');
}

function b64_to_ab(b64) {
  return Buffer.from(b64, 'base64');
}

// Generate crypto key using PBKDF2 (matching crypto.ts)
async function getCryptoKey(secret) {
  const keyMaterial = crypto.createHash('sha256').update(secret).digest();

  // Use PBKDF2 with same parameters as crypto.ts
  return crypto.pbkdf2Sync(
    keyMaterial,
    'ai-gateway-salt',
    100000,
    32,
    'sha256'
  );
}

// Encrypt function matching crypto.ts exactly
async function encrypt(text, secret) {
  const key = await getCryptoKey(secret);
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipher('aes-256-gcm', key);
  cipher.setIV(iv);

  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const authTag = cipher.getAuthTag();

  // Combine as iv:encryptedData (matching crypto.ts format)
  const encryptedData = Buffer.concat([
    Buffer.from(encrypted, 'base64'),
    authTag
  ]);

  return `${ab_to_b64(iv)}:${ab_to_b64(encryptedData)}`;
}

// Your encryption key (same one used in wrangler secret)
const ENCRYPTION_KEY = 'c7wtWWJMMYbhuFhHxxL4iiPKM+YdGm2lWEPQ6sWHT38=';

// Example: Encrypt existing plain-text keys
const existingKeys = [
  // Add your existing plain-text API keys here
  // 'sk-your-openai-key',
  // 'sk-or-v1-your-openrouter-key',
  // etc.
];

async function runMigration() {
  console.log('🔐 API Key Encryption Migration Script');
  console.log('=====================================');
  console.log(`Encryption Key: ${ENCRYPTION_KEY.substring(0, 10)}...`);
  console.log('');

  if (existingKeys.length === 0) {
    console.log('No keys to migrate. Add your existing plain-text keys to the existingKeys array.');
    console.log('');
    console.log('Example:');
    console.log("const existingKeys = [");
    console.log("  'sk-your-openai-key-here',");
    console.log("  'sk-or-v1-your-openrouter-key-here'");
    console.log("];");
    return;
  }

  for (let i = 0; i < existingKeys.length; i++) {
    const key = existingKeys[i];
    const encrypted = await encrypt(key, ENCRYPTION_KEY);
    console.log(`Key ${i + 1}:`);
    console.log(`  Plain: ${key.substring(0, 10)}...${key.substring(key.length - 4)}`);
    console.log(`  Encrypted: ${encrypted}`);
    console.log('');
  }

  console.log('📝 Database Migration Steps:');
  console.log('1. Query existing providers: SELECT id, name, api_key_encrypted FROM providers');
  console.log('2. For each plain-text key, use the encrypted version above');
  console.log('3. Update the database: UPDATE providers SET api_key_encrypted = ? WHERE id = ?');
  console.log('');
  console.log('✅ After migration, all API keys will be securely encrypted!');
}

runMigration().catch(console.error);
