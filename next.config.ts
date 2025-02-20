import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_COGNITO_USER_POOL_ID: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || 'placeholder',
    NEXT_PUBLIC_COGNITO_CLIENT_ID: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || 'placeholder',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://0wq09bpeu5.execute-api.us-west-1.amazonaws.com',
    NEXT_PUBLIC_STAGE: process.env.NEXT_PUBLIC_STAGE || 'prod'
  },
  basePath: '',
  trailingSlash: false,
};

export default nextConfig;