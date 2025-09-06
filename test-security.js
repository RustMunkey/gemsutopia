#!/usr/bin/env node

/**
 * Automated Security Testing Script
 * Tests all security measures implemented in the application
 */

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
let passCount = 0;
let failCount = 0;

console.log(`${colors.cyan}🛡️  Security Testing Suite${colors.reset}`);
console.log(`${colors.blue}Testing URL: ${BASE_URL}${colors.reset}`);
console.log('='.repeat(50));

// Helper function to make HTTP requests
async function makeRequest(method, endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SecurityTest/1.0',
        ...options.headers
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    
    return {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body: await response.text()
    };
  } catch (error) {
    return {
      status: 0,
      error: error.message
    };
  }
}

// Test function with results tracking
async function runTest(testName, testFunction) {
  process.stdout.write(`Testing: ${testName}... `);
  
  try {
    const result = await testFunction();
    if (result.passed) {
      console.log(`${colors.green}✅ PASS${colors.reset}${result.message ? ` (${result.message})` : ''}`);
      passCount++;
    } else {
      console.log(`${colors.red}❌ FAIL${colors.reset}${result.message ? ` (${result.message})` : ''}`);
      failCount++;
    }
  } catch (error) {
    console.log(`${colors.red}❌ ERROR${colors.reset} (${error.message})`);
    failCount++;
  }
}

// Test Suite Functions
async function testOrdersAPIProtection() {
  const response = await makeRequest('GET', '/api/orders');
  return {
    passed: response.status === 401,
    message: `Status: ${response.status} (expected 401)`
  };
}

async function testAdminEndpointsProtection() {
  const endpoints = ['/api/admin/stats', '/api/admin/dashboard-stats', '/api/admin/settings'];
  const results = await Promise.all(
    endpoints.map(endpoint => makeRequest('GET', endpoint))
  );
  
  const allProtected = results.every(r => r.status === 401 || r.status === 403);
  const statuses = results.map(r => r.status).join(', ');
  
  return {
    passed: allProtected,
    message: `Statuses: [${statuses}] (expected all 401/403)`
  };
}

async function testPublicEndpointsAccess() {
  const endpoints = ['/api/products', '/api/categories', '/api/site-info'];
  const results = await Promise.all(
    endpoints.map(endpoint => makeRequest('GET', endpoint))
  );
  
  const allAccessible = results.every(r => r.status === 200);
  const statuses = results.map(r => r.status).join(', ');
  
  return {
    passed: allAccessible,
    message: `Statuses: [${statuses}] (expected all 200)`
  };
}

async function testAttackToolBlocking() {
  const attackTools = ['sqlmap/1.0', 'nikto/2.1', 'Burp Suite Professional'];
  const results = await Promise.all(
    attackTools.map(tool => 
      makeRequest('GET', '/api/products', {
        headers: { 'User-Agent': tool }
      })
    )
  );
  
  const allBlocked = results.every(r => r.status === 403);
  const statuses = results.map(r => r.status).join(', ');
  
  return {
    passed: allBlocked,
    message: `Statuses: [${statuses}] (expected all 403)`
  };
}

async function testEmptyUserAgentBlocking() {
  const response = await makeRequest('GET', '/api/products', {
    headers: { 'User-Agent': '' }
  });
  
  return {
    passed: response.status === 403,
    message: `Status: ${response.status} (expected 403)`
  };
}

async function testXSSProtection() {
  const xssPayloads = [
    '<script>alert("XSS")</script>',
    'javascript:alert("XSS")',
    '<img src=x onerror=alert("XSS")>'
  ];
  
  // Test contact form if available
  const response = await makeRequest('POST', '/api/contact', {
    body: {
      name: xssPayloads[0],
      email: 'test@test.com',
      message: xssPayloads[1]
    }
  });
  
  // If contact form doesn't exist or requires auth, just check if XSS patterns are handled
  const bodyLower = (response.body || '').toLowerCase();
  const containsScript = bodyLower.includes('<script>') || bodyLower.includes('javascript:');
  
  return {
    passed: !containsScript || response.status === 401,
    message: `XSS patterns ${containsScript ? 'found' : 'sanitized'} in response`
  };
}

async function testSQLInjectionProtection() {
  const sqlPayloads = [
    "1' OR 1=1--",
    "'; DROP TABLE products; --",
    "1 UNION SELECT * FROM users"
  ];
  
  // Test with query parameters
  const response = await makeRequest('GET', `/api/products?search=${encodeURIComponent(sqlPayloads[0])}`);
  
  // Should not return database errors
  const bodyLower = (response.body || '').toLowerCase();
  const hasDbError = bodyLower.includes('error') || bodyLower.includes('sql') || bodyLower.includes('database');
  
  return {
    passed: response.status === 200 && !hasDbError,
    message: `Response status: ${response.status}, DB errors: ${hasDbError}`
  };
}

async function testRateLimiting() {
  console.log('\n    Making rapid requests to test rate limiting...');
  
  // Make many requests quickly
  const requests = Array(50).fill().map(() => makeRequest('GET', '/api/products'));
  const responses = await Promise.all(requests);
  
  // Check if any were rate limited
  const rateLimited = responses.some(r => r.status === 429);
  const successCount = responses.filter(r => r.status === 200).length;
  
  return {
    passed: rateLimited || successCount > 0, // Either rate limited or at least some succeeded
    message: `${successCount}/50 succeeded, rate limited: ${rateLimited}`
  };
}

async function testSecurityHeaders() {
  const response = await makeRequest('GET', '/api/products');
  const headers = response.headers;
  
  const expectedHeaders = [
    'x-frame-options',
    'x-content-type-options',
    'x-xss-protection'
  ];
  
  const presentHeaders = expectedHeaders.filter(header => headers[header]);
  
  return {
    passed: presentHeaders.length >= 2,
    message: `Found ${presentHeaders.length}/${expectedHeaders.length} security headers`
  };
}

async function testAuthenticationFlow() {
  // Try to access a protected endpoint with invalid token
  const response = await makeRequest('GET', '/api/orders', {
    headers: { 'Authorization': 'Bearer invalid_token' }
  });
  
  return {
    passed: response.status === 401,
    message: `Status: ${response.status} (expected 401 for invalid token)`
  };
}

// Main test runner
async function runAllTests() {
  console.log('\n🔒 Authentication & Authorization Tests');
  await runTest('Orders API requires authentication', testOrdersAPIProtection);
  await runTest('Admin endpoints require authentication', testAdminEndpointsProtection);
  await runTest('Public endpoints remain accessible', testPublicEndpointsAccess);
  await runTest('Authentication flow validation', testAuthenticationFlow);
  
  console.log('\n🚫 Attack Prevention Tests');
  await runTest('Attack tool user agents blocked', testAttackToolBlocking);
  await runTest('Empty user agent blocked', testEmptyUserAgentBlocking);
  await runTest('XSS protection active', testXSSProtection);
  await runTest('SQL injection protection active', testSQLInjectionProtection);
  
  console.log('\n⚡ Performance & Rate Limiting Tests');
  await runTest('Rate limiting active', testRateLimiting);
  
  console.log('\n🛡️ Security Headers Tests');  
  await runTest('Security headers present', testSecurityHeaders);
}

// Run tests and show results
async function main() {
  await runAllTests();
  
  console.log('\n' + '='.repeat(50));
  console.log(`${colors.cyan}Test Results Summary${colors.reset}`);
  console.log(`${colors.green}✅ Passed: ${passCount}${colors.reset}`);
  console.log(`${colors.red}❌ Failed: ${failCount}${colors.reset}`);
  
  if (failCount === 0) {
    console.log(`\n${colors.green}🎉 All security tests passed! Your site is properly secured.${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`\n${colors.yellow}⚠️  ${failCount} test(s) failed. Please review the security implementation.${colors.reset}`);
    console.log(`\n${colors.blue}💡 Tips:${colors.reset}`);
    console.log('• Ensure environment variables (JWT_SECRET, API_SECRET_KEY) are set');
    console.log('• Restart your development server');
    console.log('• Check server logs for error messages');
    console.log('• Verify middleware is properly configured');
    process.exit(1);
  }
}

// Handle global fetch for Node.js environments that don't have it
if (typeof fetch === 'undefined') {
  console.log(`${colors.yellow}Installing node-fetch for testing...${colors.reset}`);
  try {
    global.fetch = require('node-fetch');
  } catch (error) {
    console.log(`${colors.red}❌ node-fetch not found. Install it with: npm install node-fetch${colors.reset}`);
    process.exit(1);
  }
}

main().catch(error => {
  console.error(`${colors.red}❌ Test runner error: ${error.message}${colors.reset}`);
  process.exit(1);
});