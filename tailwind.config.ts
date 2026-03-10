import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#137fec",
                secondary: "#f3f4f6",
                // 카테고리별 고유 컬러 등록 (라벨링 및 배지용)
                'cat-job': "#2563eb",   // 일자리·취업 (blue-600)
                'cat-health': "#16a34a", // 건강·의료 (green-600)
                'cat-house': "#4f46e5",  // 주거·금융 (indigo-600)
                'cat-living': "#ea580c", // 생활·안전 (orange-600)
                'cat-child': "#db2777",  // 임신·육아 (pink-600)
                'cat-etc': "#4b5563",    // 기타 (gray-600)
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic":
                    "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
            },
            fontFamily: {
                sans: ['var(--font-inter)', 'sans-serif'],
            },
        },
    },
    plugins: [],
};
export default config;
