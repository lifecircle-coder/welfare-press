/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'wvocjgtnsjdzonhyzbic.supabase.co',
                port: '',
                pathname: '/storage/v1/object/public/**',
            },
            {
                protocol: 'https',
                hostname: 'wvocjgtnsjdzonhyzbic.supabase.co',
                port: '',
                pathname: '/storage/v1/render/image/public/**',
            },
            {
                protocol: 'https',
                hostname: 'viewstory.net',
                port: '',
                pathname: '/**',
            },
        ],
    },
};

export default nextConfig;
