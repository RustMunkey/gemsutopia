import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'odqcbgwakcysfluoinmn.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.hcaptcha.com https://hcaptcha.com https://js.stripe.com https://www.googletagmanager.com https://www.paypal.com https://*.paypal.com 'wasm-unsafe-eval'; frame-src https://hcaptcha.com https://newassets.hcaptcha.com https://js.stripe.com https://hooks.stripe.com https://www.paypal.com https://*.paypal.com; style-src 'self' 'unsafe-inline' https://hcaptcha.com https://newassets.hcaptcha.com; connect-src 'self' https://hcaptcha.com https://api.hcaptcha.com https://*.supabase.co https://api.stripe.com https://www.google-analytics.com https://www.paypal.com https://*.paypal.com https://api.sandbox.paypal.com https://api.emailjs.com https://api.devnet.solana.com https://devnet.helius-rpc.com https://rpc.sepolia.org https://sepolia.etherscan.io https://api.coingecko.com;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
