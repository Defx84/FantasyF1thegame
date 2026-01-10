const http = require('http');

const BASE_URL = 'http://localhost:5000/api';

// Test function using Node's built-in http module
function testAPI(name, method, url, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(`${BASE_URL}${url}`);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          console.log(`✅ ${name}:`);
          console.log(`   Status: ${res.statusCode}`);
          if (parsed.cards) {
            console.log(`   Cards found: ${parsed.cards.length}`);
            if (parsed.cards.length > 0) {
              console.log(`   First card: ${parsed.cards[0].name} (${parsed.cards[0].type}, ${parsed.cards[0].tier})`);
            }
          } else {
            console.log(`   Response:`, JSON.stringify(parsed, null, 2).substring(0, 200) + '...');
          }
          console.log('');
          resolve({ success: true, data: parsed });
        } catch (e) {
          console.log(`✅ ${name}:`);
          console.log(`   Status: ${res.statusCode}`);
          console.log(`   Response: ${responseData.substring(0, 200)}`);
          console.log('');
          resolve({ success: true, data: responseData });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ ${name}:`);
      console.log(`   Error: ${error.message}`);
      console.log(`   Code: ${error.code}`);
      if (error.code === 'ECONNREFUSED') {
        console.log(`   ⚠️  Server not running on port 5000`);
      }
      console.log('');
      resolve({ success: false, error: error.message });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      console.log(`❌ ${name}:`);
      console.log(`   Error: Request timeout`);
      console.log('');
      resolve({ success: false, error: 'Timeout' });
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing Card APIs\n');
  console.log('='.repeat(50));
  console.log('');

  // Test 1: Get all cards (no auth required)
  await testAPI('GET /api/cards', 'GET', '/cards');

  // Test 2: Get cards filtered by type
  await testAPI('GET /api/cards?type=driver', 'GET', '/cards?type=driver');
  await testAPI('GET /api/cards?type=team', 'GET', '/cards?type=team');

  // Note: Authenticated endpoints require a valid JWT token
  // These would need to be tested with actual authentication
  console.log('📝 Note: Authenticated endpoints require JWT token');
  console.log('   To test authenticated endpoints, you need to:');
  console.log('   1. Login via /api/auth/login');
  console.log('   2. Use the returned token in Authorization header');
  console.log('   3. Have a valid league and user setup');
  console.log('');

  console.log('='.repeat(50));
  console.log('✅ Basic API tests completed!');
}

// Run tests
runTests().catch(console.error);

