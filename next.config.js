/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    eslint: {
        ignoreDuringBuilds: true,
    },
    async rewrites() {
        return [
            {
                source: '/api/v1/:path*',
                // destination: 'https://testingdomain.store/api/v1/:path*',
                destination: 'http://localhost:4000/api/v1/:path*',
            },
        ];
    },
};

module.exports = nextConfig;
