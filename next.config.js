/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async rewrites() {
    return {
      beforeFiles: [{ source: '/', destination: '/arena.html' }],
      afterFiles: [],
      fallback: [],
    };
  },
  async headers() {
    return [{
      source: '/(:path*)',
      headers: [
        { key: 'Content-Security-Policy', value: "object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors https://*.minepi.com https://minepi.com https://*.pinet.com https://*.socialchain.app;" },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    }];
  },
};
module.exports = nextConfig;
