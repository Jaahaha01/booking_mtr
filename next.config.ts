/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['i.ibb.co'],
  },
  experimental: {
    turbo: false
  }
};

module.exports = nextConfig;
