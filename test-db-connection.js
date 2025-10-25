const { Client } = require('pg');
require('dotenv').config();

console.log('Testing database connection...');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_USERNAME:', process.env.DB_USERNAME);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? 'Found' : 'Not found');
console.log('DB_NAME:', process.env.DB_NAME);

async function testConnection() {
  // Test using host.docker.internal (Docker Desktop for Windows)
  console.log('\n--- Testing Docker Bridge ---');
  console.log('Attempting to find Docker host IP...');

  // On Windows Docker Desktop, sometimes the host IP is different
  const testHosts = ['127.0.0.1', 'localhost', 'host.docker.internal'];

  for (const host of testHosts) {
    console.log(`\n--- Testing ${host} ---`);
    const client = new Client({
      host: host,
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'testpass123',
      database: process.env.DB_NAME || 'subscription_db',
      connectionTimeoutMillis: 5000,
    });

    try {
      await client.connect();
      console.log(`✅ ${host} connection successful!`);
      const result = await client.query('SELECT version()');
      console.log('Database version:', result.rows[0].version);
      await client.end();
      console.log(`\n🎉 Success! Use DB_HOST=${host} in your .env file`);
      return true;
    } catch (error) {
      console.error(`❌ ${host} connection failed:`, error.message);
      try {
        await client.end();
      } catch (e) {
        // ignore cleanup errors
      }
    }
  }

  return false;
}

testConnection().then((success) => {
  if (!success) {
    console.log('\n😞 All connection attempts failed.');
    console.log(
      'Docker containers are running, but Node.js cannot connect from Windows host.',
    );
    console.log('This is a common Docker Desktop networking issue on Windows.');
    console.log('\nRecommended solutions:');
    console.log('1. Run your app in Docker (use docker-compose up app)');
    console.log('2. Check Docker Desktop networking settings');
    console.log('3. Try restarting Docker Desktop');
  }
});
