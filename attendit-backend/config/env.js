// Loads backend environment variables from attendit-backend/.env.
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '..', '.env');
const result = dotenv.config({ path: envPath, quiet: true });

if (result.error && result.error.code !== 'ENOENT') {
  throw result.error;
}

function assertSecureSecret(name, value) {
  if (!value) return;
  const unsafeDefaults = new Set([
    'secret',
    'jwt_secret',
    'replace_me',
    'replace_me_with_a_long_random_string',
  ]);

  if (unsafeDefaults.has(String(value).trim()) || String(value).length < 32) {
    throw new Error(`${name} must be a unique secret with at least 32 characters.`);
  }
}

assertSecureSecret('JWT_SECRET', process.env.JWT_SECRET);

module.exports = { envPath };
