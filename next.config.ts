import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_COGNITO_USER_POOL_ID: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || 'us-west-1_7QUYyy6TP',
    NEXT_PUBLIC_COGNITO_CLIENT_ID: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '5e3i71vokgv9qccu67hhbevqos',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://xtxfuhrel1.execute-api.us-west-1.amazonaws.com/prod',
    NEXT_PUBLIC_STAGE: process.env.NEXT_PUBLIC_STAGE || 'prod'
  },
  basePath: '',
  trailingSlash: false,
};

// Log the Cognito configuration during build to help with debugging
console.log('Next.js Cognito Configuration:');
console.log('User Pool ID:', nextConfig.env?.NEXT_PUBLIC_COGNITO_USER_POOL_ID);
console.log('Client ID:', nextConfig.env?.NEXT_PUBLIC_COGNITO_CLIENT_ID);

export default nextConfig;