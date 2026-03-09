/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    images: {
        unoptimized: true, // 로컬, 외부 구분 없이 원본 이미지를 그대로 렌더링. Unconfigured Host 에러 차단 방지
    },
};

export default nextConfig;
