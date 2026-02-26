/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  // Removed output: 'export' to enable API routes
  trailingSlash: true,
  images: {
    unoptimized: true
  }
}

export default nextConfig
