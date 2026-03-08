import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Experimental server actions are enabled by default in Next 15
  experimental: {
    // Increase body parser limit for file uploads
    serverActions: {
      bodySizeLimit: '26mb',
    },
  },
  // Images config
  images: {
    remotePatterns: [],
  },
}

export default nextConfig
