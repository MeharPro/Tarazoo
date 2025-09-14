export default {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
        pathname: '/s/files/**'
      }
    ]
  },
  async redirects() {
    return [
      { source: '/merchent/:path*', destination: '/merchant/:path*', permanent: false },
      { source: '/api/merchent/:path*', destination: '/api/merchant/:path*', permanent: false }
    ]
  }
};
