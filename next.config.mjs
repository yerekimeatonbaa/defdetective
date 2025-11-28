/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ],
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      // Used by Genkit
      'uglify-js': false,
      '@babel/core': false,
      'node-gyp': false,
      'node-pre-gyp': false,
      'mock-aws-s3': false,
      'aws-sdk': false,
      'nock': false,
    };
    return config;
  }
};

export default nextConfig;
