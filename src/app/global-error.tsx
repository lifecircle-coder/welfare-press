'use client';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html>
            <body>
                <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">치명적인 오류가 발생했습니다.</h2>
                    <button
                        onClick={() => reset()}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        다시 시도
                    </button>
                    <pre className="mt-4 p-4 bg-gray-100 rounded text-xs text-left overflow-auto max-w-full">
                        {error.message}
                    </pre>
                </div>
            </body>
        </html>
    );
}
