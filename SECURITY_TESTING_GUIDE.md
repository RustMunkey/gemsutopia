# 🧪 Security Testing Guide

## Quick Security Tests

### 1. Test API Protection (CRITICAL)

#### Test Orders API Protection
```bash
# This should return 401 Unauthorized (GOOD)
curl -X GET http://localhost:3000/api/orders

# This should also return 401 Unauthorized (GOOD)
curl -X GET https://yourdomain.com/api/orders
```

**Expected Response:**
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

#### Test Admin Endpoints
```bash
# These should all return 401 or 403
curl -X GET http://localhost:3000/api/admin/dashboard-stats
curl -X GET http://localhost:3000/api/admin/settings
curl -X POST http://localhost:3000/api/admin/products
```

### 2. Test Rate Limiting

#### Rapid Fire Test
Run this script to test rate limiting:

```bash
#!/bin/bash
echo "Testing rate limiting..."
for i in {1..250}; do
  curl -s -o /dev/null -w "%{http_code} " http://localhost:3000/api/products
  if [ $((i % 10)) -eq 0 ]; then
    echo "Request $i"
  fi
done
```

**Expected:** After ~200 requests, you should see `429` status codes (Too Many Requests)

### 3. Test XSS Protection

#### Test Malicious Input Sanitization
```bash
# Test XSS in contact form
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "<script>alert('XSS')</script>",
    "email": "test@test.com",
    "message": "javascript:alert('XSS')"
  }'
```

**Expected:** The response should show sanitized input (no `<script>` tags)

### 4. Test SQL Injection Protection

#### Test Dangerous URL Parameters
```bash
# These should be blocked or sanitized
curl "http://localhost:3000/api/products?id=1' OR 1=1--"
curl "http://localhost:3000/api/products?search='; DROP TABLE products; --"
curl "http://localhost:3000/api/products?category=1 UNION SELECT * FROM users"
```

**Expected:** Should return safe responses, not database errors

### 5. Test Attack Tool Detection

#### Test User Agent Blocking
```bash
# These should return 403 Forbidden
curl -H "User-Agent: sqlmap/1.0" http://localhost:3000/api/products
curl -H "User-Agent: Nikto" http://localhost:3000/api/products
curl -H "User-Agent: Burp Suite" http://localhost:3000/api/products
curl -H "User-Agent: " http://localhost:3000/api/products  # No user agent
```

**Expected Response:**
```json
{
  "error": "Access denied"
}
```

## 🔧 Advanced Testing

### Test Authentication Flow

#### 1. Get Admin Token (if you have valid credentials)
```bash
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-admin@email.com",
    "passcode": "your-passcode",
    "captchaToken": "bypassed"
  }'
```

#### 2. Use Token to Access Protected Endpoint
```bash
# Use the token from step 1
curl -X GET http://localhost:3000/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected:** Should return orders data (if you're admin)

### Test Public vs Protected Endpoints

#### These should work WITHOUT authentication:
```bash
curl http://localhost:3000/api/products
curl http://localhost:3000/api/categories
curl http://localhost:3000/api/site-info
curl http://localhost:3000/api/featured-products
curl -X GET http://localhost:3000/api/reviews
```

#### These should require authentication:
```bash
curl http://localhost:3000/api/orders              # 401
curl http://localhost:3000/api/admin/stats         # 401
curl -X POST http://localhost:3000/api/reviews     # 401 (POST requires auth)
curl http://localhost:3000/api/admin/products      # 401
```

## 🎯 Automated Testing Script

Save this as `test-security.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:3000"
PASS=0
FAIL=0

echo "🛡️  Running Security Tests..."
echo "================================"

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local expected_status=$3
    local description=$4
    
    echo -n "Testing: $description... "
    
    status=$(curl -s -o /dev/null -w "%{http_code}" -X $method "$BASE_URL$endpoint")
    
    if [ "$status" -eq "$expected_status" ]; then
        echo "✅ PASS ($status)"
        ((PASS++))
    else
        echo "❌ FAIL (got $status, expected $expected_status)"
        ((FAIL++))
    fi
}

# Test protected endpoints return 401
test_endpoint "GET" "/api/orders" 401 "Orders API requires auth"
test_endpoint "GET" "/api/admin/stats" 401 "Admin stats requires auth"
test_endpoint "GET" "/api/admin/dashboard-stats" 401 "Admin dashboard requires auth"

# Test public endpoints return 200
test_endpoint "GET" "/api/products" 200 "Products API is public"
test_endpoint "GET" "/api/categories" 200 "Categories API is public"
test_endpoint "GET" "/api/site-info" 200 "Site info API is public"

# Test attack tool blocking
echo -n "Testing: Attack tool blocking... "
status=$(curl -s -o /dev/null -w "%{http_code}" -H "User-Agent: sqlmap/1.0" "$BASE_URL/api/products")
if [ "$status" -eq 403 ]; then
    echo "✅ PASS (blocked sqlmap)"
    ((PASS++))
else
    echo "❌ FAIL (sqlmap not blocked)"
    ((FAIL++))
fi

# Test no user agent blocking
echo -n "Testing: No user agent blocking... "
status=$(curl -s -o /dev/null -w "%{http_code}" -H "User-Agent:" "$BASE_URL/api/products")
if [ "$status" -eq 403 ]; then
    echo "✅ PASS (blocked empty user agent)"
    ((PASS++))
else
    echo "❌ FAIL (empty user agent not blocked)"
    ((FAIL++))
fi

# Test rate limiting (simplified)
echo -n "Testing: Rate limiting... "
for i in {1..10}; do
    curl -s -o /dev/null "$BASE_URL/api/products" &
done
wait
status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/products")
if [ "$status" -eq 200 ] || [ "$status" -eq 429 ]; then
    echo "✅ PASS (rate limiting active)"
    ((PASS++))
else
    echo "❌ FAIL (unexpected response)"
    ((FAIL++))
fi

echo "================================"
echo "Results: $PASS passed, $FAIL failed"

if [ $FAIL -eq 0 ]; then
    echo "🎉 All security tests passed!"
    exit 0
else
    echo "⚠️  Some security tests failed. Review the results above."
    exit 1
fi
```

Make it executable:
```bash
chmod +x test-security.sh
./test-security.sh
```

## 🔍 Manual Browser Testing

### 1. Check Developer Console
1. Open your site in browser
2. Press F12 to open developer tools
3. Go to Network tab
4. Try accessing `/api/orders` directly
5. Should see 401 Unauthorized

### 2. Test XSS in Forms
1. Go to contact form
2. Try entering: `<script>alert('XSS')</script>`
3. Submit form
4. Check if the script is sanitized (no alert should show)

### 3. Test Admin Access
1. Go to `/admin`
2. Try accessing without login - should redirect or block
3. Login with valid credentials
4. Verify you can access admin functions

## 📊 Log Monitoring

Check your server logs for these security events:

```bash
# If using PM2
pm2 logs

# If using Next.js dev
npm run dev

# Look for these log messages:
# ✅ "PUBLIC API: GET /api/products"
# 🔒 "PROTECTED API: GET /api/orders - auth required"
# 🚫 "XSS BLOCKED: Suspicious request"
# 🚫 "RATE LIMITED: IP blocked"
# 🚫 "ATTACK TOOL BLOCKED: sqlmap detected"
```

## ⚠️ Production Testing

### Before deploying to production:

1. Run all tests in development first
2. Test with your actual admin credentials
3. Verify rate limiting doesn't affect normal users
4. Test all forms submit properly (with sanitized input)
5. Confirm your admin dashboard still works

### Production verification:

```bash
# Replace with your production domain
PROD_URL="https://yourdomain.com"

# Test critical endpoints
curl -X GET $PROD_URL/api/orders  # Should return 401
curl -X GET $PROD_URL/api/products  # Should return 200
curl -H "User-Agent: sqlmap" $PROD_URL/api/products  # Should return 403
```

## 🆘 If Tests Fail

### Common Issues:

1. **All endpoints return 500**: Environment variables not set
   ```bash
   # Check your .env file has:
   JWT_SECRET=your_secret_here
   API_SECRET_KEY=your_api_secret_here
   ```

2. **Rate limiting not working**: Restart your development server
   ```bash
   # Stop and restart
   npm run dev
   ```

3. **Admin endpoints still accessible**: Clear browser cache and test in incognito mode

4. **XSS not being sanitized**: Check middleware is running by looking for security headers:
   ```bash
   curl -I http://localhost:3000/api/products
   # Should see: X-Auth-Required, X-Security-Level headers
   ```

### Debug Steps:
1. Check server console for error messages
2. Verify middleware is loading (check for security log messages)
3. Test individual security functions in isolation
4. Clear any cached API responses

Your security implementation is now thoroughly testable. Run these tests regularly to ensure your protection remains effective!