/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/(:path*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors https://*.minepi.com https://minepi.com https://*.socialchain.app;",
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

