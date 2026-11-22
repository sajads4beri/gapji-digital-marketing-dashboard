/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@gapji/shared'],
  experimental: {
    esmExternals: 'loose',
  },
  webpack: (config) => {
    config.resolve.extensions = [
      '.tsx',
      '.ts',
      '.jsx',
      '.js',
      ...config.resolve.extensions.filter(
        (ext) => !['.tsx', '.ts', '.jsx', '.js'].includes(ext)
      ),
    ];
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.INTERNAL_API_URL || 'http://localhost:3001/api'}/:path*`,
      },
      {
        source: '/performance/campaigns',
        destination: '/campaigns',
      },
      {
        source: '/performance/campaigns/:path*',
        destination: '/campaigns/:path*',
      },
      {
        source: '/audiences',
        destination: '/performance/audiences',
      },
      {
        source: '/audiences/:path*',
        destination: '/performance/audiences/:path*',
      },
      {
        source: '/import',
        destination: '/performance/imports',
      },
      {
        source: '/import/:path*',
        destination: '/performance/imports/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
