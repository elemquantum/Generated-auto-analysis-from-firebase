
import type {NextConfig} from 'next';

// Load environment variables from .env file
require('dotenv').config();

const nextConfig: NextConfig = {
  output: "standalone",
  env: {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || process.env.gemini_api_key,
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.firebase_api_key,
  },
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  devIndicators: {
    position: 'bottom-right',
    allowedDevOrigins: [
        'https://*.cloudworkstations.dev',
        'https://*.firebase.studio'
    ],
  },
};

export default nextConfig;
