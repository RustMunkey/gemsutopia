# 🛡️ PRODUCTION SECURITY TESTING GUIDE

## 🌐 Live Domain Security Verification

Use this guide to test your security implementation on your live production website.

---

## 🔧 Setup

Replace `DOMAIN` with your actual domain in all commands below:

```bash
# Set your production domain
DOMAIN="https://gemsutopia.ca"
# or
DOMAIN="https://yourdomain.com"
```

---

## 🚨 CRITICAL SECURITY TESTS

### 1. **Customer Data Protection** (MOST CRITICAL)

```bash
# This should return 401 Unauthorized (CRITICAL TEST)
curl -X GET $DOMAIN/api/orders
```

**Expected Response:**
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

❌ **If this returns customer data instead of 401, YOUR SITE IS COMPROMISED**

---

### 2. **Admin Endpoint Protection**

```bash
# All of these should return 401 Unauthorized
curl -X GET $DOMAIN/api/admin/settings
curl -X GET $DOMAIN/api/admin/stats  
curl -X GET $DOMAIN/api/admin/dashboard-stats
```

**Expected Response for all:**
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

---

### 3. **Public Endpoints Verification**

```bash
# These should work normally (return 200 with data)
curl -X GET $DOMAIN/api/products
curl -X GET $DOMAIN/api/categories
curl -X GET $DOMAIN/api/site-info
curl -X GET $DOMAIN/api/featured-products
curl -X GET $DOMAIN/api/reviews
```

**Expected:** All should return `{"success":true, "data":...}` or similar valid responses

---

### 4. **Attack Prevention Tests**

#### Test Attack Tool Blocking:
```bash
# These should return 403 Access Denied
curl -H "User-Agent: sqlmap/1.0" $DOMAIN/api/products
curl -H "User-Agent: nikto/2.1" $DOMAIN/api/products  
curl -H "User-Agent: Burp Suite" $DOMAIN/api/products
```

**Expected Response:**
```json
{
  "error": "Access denied"
}
```

#### Test Empty User Agent Blocking:
```bash
# This should return 403
curl -H "User-Agent:" $DOMAIN/api/products
```

---

### 5. **XSS Protection Test**

```bash
# Test XSS in contact form (should sanitize input)
curl -X POST $DOMAIN/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "<script>alert(\"XSS\")</script>",
    "email": "security@test.com",
    "message": "javascript:alert(\"XSS\")"
  }'
```

**Expected:** No `<script>` tags in response, input should be sanitized

---

### 6. **SQL Injection Protection Test**

```bash
# These should NOT cause database errors
curl "$DOMAIN/api/products?search=%27%20OR%201%3D1--"
curl "$DOMAIN/api/products?category=1%20UNION%20SELECT%20*%20FROM%20users"
```

**Expected:** Normal product responses, no database error messages

---

### 7. **Rate Limiting Test**

```bash
# Make rapid requests to test rate limiting
echo "Testing rate limiting with rapid requests..."
for i in {1..50}; do
  curl -s -o /dev/null "$DOMAIN/api/products" &
  if [ $((i % 10)) -eq 0 ]; then
    echo "Sent $i requests..."
  fi
done
wait

# Check if server is still responding
curl "$DOMAIN/api/products"
```

**Expected:** Either rate limiting kicks in (429 errors) or server remains stable

---

### 8. **Security Headers Check**

```bash
# Check security headers are present
curl -I $DOMAIN/api/products
```

**Look for these headers:**
- `Content-Security-Policy`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`

---

## 🔐 AUTHENTICATION FLOW TEST

### Test Admin Login Flow:

```bash
# 1. Try login with invalid credentials (should fail)
curl -X POST $DOMAIN/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "hacker@test.com",
    "passcode": "wrong",
    "captchaToken": "bypassed"
  }'
```

**Expected:** Login failure response

### Test with Valid Credentials:

```bash
# 2. Login with your actual admin credentials
curl -X POST $DOMAIN/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-admin@email.com",
    "passcode": "your-actual-passcode",
    "captchaToken": "bypassed"
  }'
```

**Expected:** Should return JWT token if credentials are correct

### Test Protected Access:

```bash
# 3. Use the token from step 2 to access protected data
TOKEN="your_jwt_token_from_step_2"
curl -X GET $DOMAIN/api/orders \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:** Should return order data when using valid admin token

---

## 🚨 AUTOMATED SECURITY SCAN

Save this as `production-security-test.sh`:

```bash
#!/bin/bash

# Production Security Test Script
DOMAIN="https://your-domain.com"  # CHANGE THIS
PASS=0
FAIL=0

echo "🛡️ PRODUCTION SECURITY SCAN"
echo "Testing: $DOMAIN"
echo "=========================="

# Test function
test_endpoint() {
    local description="$1"
    local command="$2"
    local expected="$3"
    
    echo -n "Testing: $description... "
    
    result=$(eval $command 2>/dev/null)
    status=$(eval $command -w "%{http_code}" -s -o /dev/null 2>/dev/null)
    
    if [[ $status == $expected ]]; then
        echo "✅ PASS ($status)"
        ((PASS++))
    else
        echo "❌ FAIL (got $status, expected $expected)"
        ((FAIL++))
    fi
}

# Critical tests
test_endpoint "Orders API protection" "curl -s '$DOMAIN/api/orders'" "401"
test_endpoint "Admin settings protection" "curl -s '$DOMAIN/api/admin/settings'" "401"
test_endpoint "Products API accessibility" "curl -s '$DOMAIN/api/products'" "200"
test_endpoint "Attack tool blocking" "curl -s -H 'User-Agent: sqlmap/1.0' '$DOMAIN/api/products'" "403"
test_endpoint "Empty user agent blocking" "curl -s -H 'User-Agent:' '$DOMAIN/api/products'" "403"

echo "=========================="
echo "Results: $PASS passed, $FAIL failed"

if [ $FAIL -eq 0 ]; then
    echo "🎉 ALL CRITICAL SECURITY TESTS PASSED!"
    echo "✅ Your production site is properly secured"
else
    echo "⚠️ $FAIL security test(s) FAILED"
    echo "🚨 REVIEW YOUR SECURITY CONFIGURATION IMMEDIATELY"
fi
```

**Run it:**
```bash
chmod +x production-security-test.sh
./production-security-test.sh
```

---

## 🚨 CRITICAL FAILURE RESPONSES

### If Orders API Returns Data Instead of 401:
**🚨 EMERGENCY - CUSTOMER DATA EXPOSED**
1. Immediately disable the site or fix the authentication
2. Check environment variables are set in production
3. Verify middleware is running
4. Contact your hosting provider if needed

### If Admin Endpoints Are Accessible:
**🚨 CRITICAL - ADMIN BREACH POSSIBLE**
1. Check JWT_SECRET is set in production environment
2. Verify admin authentication middleware is working
3. Clear all admin sessions and reset tokens

### If Attack Tools Aren't Blocked:
**⚠️ WARNING - ATTACK VULNERABILITY**
1. Check middleware is properly deployed
2. Verify User-Agent filtering is active
3. Monitor logs for attack attempts

---

## ✅ SUCCESS CRITERIA

Your production site is secure when:

- ✅ Orders API returns 401 (not customer data)
- ✅ All admin endpoints return 401 (not admin data)
- ✅ Public endpoints work normally
- ✅ Attack tools are blocked (403 responses)
- ✅ XSS attempts are sanitized
- ✅ SQL injection attempts are handled safely
- ✅ Security headers are present
- ✅ Rate limiting is active

---

## 📞 Emergency Contacts

If critical tests fail:
1. **Immediately** take corrective action
2. Check server logs for security events
3. Verify environment variables in production
4. Review deployment configuration
5. Consider temporarily taking site offline if customer data is exposed

**Remember: Customer data security is CRITICAL for ecommerce sites.**

---

## 🎯 Regular Security Monitoring

**Run these tests:**
- ✅ Weekly: Quick critical endpoint checks
- ✅ Monthly: Full security scan
- ✅ After every deployment: Complete test suite
- ✅ After any security updates: Comprehensive verification

Your customers trust you with their personal and payment information. Keep it secure! 🛡️