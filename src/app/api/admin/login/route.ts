import { NextRequest, NextResponse } from 'next/server';
// import { checkRateLimit, recordFailedAttempt } from '../../../../lib/security/rateLimiter';
// import { sendLoginNotification, getClientIP, detectSuspiciousLogin } from '../../../../lib/security/notifications';
// import { sendVerificationCode } from '../../../../lib/security/twoFactor';
// import { isIPAllowed } from '../../../../lib/security/ipAllowlist';
import jwt from 'jsonwebtoken';

// Get authorized credentials from environment variables
const AUTHORIZED_USERS = [
  {
    email: process.env.ADMIN_EMAIL_1,
    passcode: process.env.ADMIN_PASSCODE_1
  },
  {
    email: process.env.ADMIN_EMAIL_2,
    passcode: process.env.ADMIN_PASSCODE_2
  },
  {
    email: process.env.ADMIN_EMAIL_3,
    passcode: process.env.ADMIN_PASSCODE_3
  }
].filter(user => user.email && user.passcode);

// User name mapping
function getUserName(email: string): string {
  switch (email) {
    case 'gemsutopia@gmail.com':
    case 'reeseroberge10@gmail.com':
      return 'Reese';
    case 'wilson.asher00@gmail.com':
      return 'Asher';
    default:
      return 'Admin';
  }
}

const HCAPTCHA_SECRET = process.env.HCAPTCHA_SECRET_KEY;

async function verifyCaptcha(token: string): Promise<boolean> {
  if (!HCAPTCHA_SECRET) {
    console.warn('HCAPTCHA_SECRET not set, skipping captcha verification in development');
    return true;
  }

  try {
    const response = await fetch('https://hcaptcha.com/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${HCAPTCHA_SECRET}&response=${token}`,
    });

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('Captcha verification error:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  // const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  // const userAgent = request.headers.get('user-agent') || 'Unknown';
  
  try {
    // 🛡️ SECURITY LAYER 1: IP Allowlist Check (TEMPORARILY DISABLED)
    // if (!isIPAllowed(ip)) {
    //   await sendLoginNotification(request, 'unknown', false, 'IP not in allowlist');
    //   return NextResponse.json(
    //     { message: 'Access denied: IP not authorized' },
    //     { status: 403 }
    //   );
    // }

    // 🛡️ SECURITY LAYER 2: Rate Limiting Check (TEMPORARILY DISABLED)
    // const rateLimitCheck = checkRateLimit(ip);
    // if (!rateLimitCheck.allowed) {
    //   const banTimeRemaining = rateLimitCheck.bannedUntil ? 
    //     Math.ceil((rateLimitCheck.bannedUntil - Date.now()) / 1000 / 60) : 0;
    //   
    //   await sendLoginNotification(request, 'unknown', false, `Rate limited - banned for ${banTimeRemaining} minutes`);
    //   
    //   return NextResponse.json(
    //     { 
    //       message: `Too many failed attempts. Try again in ${banTimeRemaining} minutes.`,
    //       bannedUntil: rateLimitCheck.bannedUntil 
    //     },
    //     { status: 429 }
    //   );
    // }
    const rateLimitCheck = { allowed: true, remainingAttempts: 5 }; // Fake rate limit check for now

    const { email, passcode, captchaToken, step = 'initial' } = await request.json();

    // 🛡️ SECURITY LAYER 3: Captcha Verification (Bypass for now)
    if (step === 'initial') {
      // Skip captcha if bypassed (temporary solution)
      if (captchaToken !== 'bypassed') {
        const captchaValid = await verifyCaptcha(captchaToken);
        if (!captchaValid) {
          // recordFailedAttempt(ip);
          return NextResponse.json(
            { message: 'Captcha verification failed' },
            { status: 400 }
          );
        }
      }

      // 🛡️ SECURITY LAYER 4: Credential Check
      console.log('Login attempt:', { email, passcode: '***' });
      console.log('Authorized users:', AUTHORIZED_USERS.map(u => ({ email: u.email, hasPasscode: !!u.passcode })));
      
      const user = AUTHORIZED_USERS.find(
        u => u.email === email && u.passcode === passcode
      );
      
      console.log('User found:', !!user);

      if (!user) {
        // recordFailedAttempt(ip);
        // await sendLoginNotification(request, email, false, 'Invalid credentials');
        
        return NextResponse.json(
          { 
            message: 'Invalid credentials',
            remainingAttempts: rateLimitCheck.remainingAttempts ? rateLimitCheck.remainingAttempts - 1 : 0
          },
          { status: 401 }
        );
      }

      // 🛡️ SECURITY LAYER 5: Suspicious Login Detection
      // const suspicious = detectSuspiciousLogin(email, ip, userAgent);
      // if (suspicious) {
      //   // await sendLoginNotification(request, email, false, 'Suspicious login attempt detected');
      //   // recordFailedAttempt(ip);
      //   return NextResponse.json(
      //     { message: 'Security check failed' },
      //     { status: 403 }
      //   );
      // }

      // ✅ LOGIN SUCCESSFUL - Create JWT token
      // await sendLoginNotification(request, email, true);
      
      // Create JWT token for the session
      const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
      const userName = getUserName(email);
      const token = jwt.sign(
        { 
          email, 
          name: userName, 
          isAdmin: true,
          loginTime: Date.now() 
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      const response = NextResponse.json({
        success: true,
        token: token,
        message: 'Login successful'
      });
      
      // Set secure httpOnly cookie as backup protection
      response.cookies.set('admin-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/'
      });
      
      return response;
    }

    // Handle 2FA code verification step
    if (step === 'verify_code') {
      // This would be handled by a separate endpoint
      return NextResponse.json(
        { message: 'Use the verify-code endpoint' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Invalid request' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Login error:', error);
    // await sendLoginNotification(request, 'unknown', false, 'Server error during login');
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}