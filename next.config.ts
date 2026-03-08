import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  // Experimental server actions are enabled by default in Next 15
  experimental: {
    // Increase body parser limit for file uploads
    serverActions: {
      bodySizeLimit: '26mb',
    },
  },
  // Set turbopack root to this directory to prevent confusion with parent lockfiles
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Images config
  images: {
    remotePatterns: [],
  },
}

export default nextConfig
