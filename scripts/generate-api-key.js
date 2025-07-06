#!/usr/bin/env node

const crypto = require('crypto');

function generateApiKey(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

function generateSecureApiKey() {
  const timestamp = Date.now().toString(36);
  const randomBytes = crypto.randomBytes(32).toString('hex');
  return `ak_${timestamp}_${randomBytes}`;
}

function main() {
  const args = process.argv.slice(2);
  const format = args.includes('--format') ? args[args.indexOf('--format') + 1] : 'secure';
  const length = args.includes('--length') ? parseInt(args[args.indexOf('--length') + 1]) : 32;
  
  let apiKey;
  
  if (format === 'secure') {
    apiKey = generateSecureApiKey();
  } else if (format === 'simple') {
    apiKey = generateApiKey(length);
  } else {
    console.error('Invalid format. Use --format secure or --format simple');
    process.exit(1);
  }
  
  console.log('Generated API Key:');
  console.log(apiKey);
  console.log('');
  console.log('Add this to your wrangler.toml:');
  console.log(`API_SECRET_KEY = "${apiKey}"`);
  console.log('');
  console.log('Or set as environment variable:');
  console.log(`export API_SECRET_KEY="${apiKey}"`);
  console.log('');
  console.log('⚠️  Keep this key secure and do not commit it to version control!');
}

if (require.main === module) {
  main();
}

module.exports = {
  generateApiKey,
  generateSecureApiKey,
};