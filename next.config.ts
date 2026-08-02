
import type {NextConfig} from 'next';

// Load environment variables from .env file
require('dotenv').config();

const nextConfig: NextConfig = {
  output: "standalone",
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
