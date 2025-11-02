/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // For Cloudflare Pages static export
  images: {
    unoptimized: true, // Required for static export
  },
}

module.exports = nextConfig
