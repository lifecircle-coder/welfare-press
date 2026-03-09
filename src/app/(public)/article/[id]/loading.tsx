export default function ArticleLoading() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl animate-pulse">
            {/* Header Skeleton */}
            <header className="mb-8 border-b-2 border-gray-100 pb-6">
                <div className="flex gap-2 mb-4">
                    <div className="w-16 h-6 bg-gray-200 rounded"></div>
                    <div className="w-24 h-6 bg-gray-100 rounded"></div>
                </div>
                <div className="w-full h-12 bg-gray-200 rounded mb-4"></div>
                <div className="w-3/4 h-12 bg-gray-200 rounded mb-6"></div>
                <div className="flex justify-between items-center text-sm">
                    <div className="flex gap-4">
                        <div className="w-20 h-4 bg-gray-200 rounded"></div>
                        <div className="w-24 h-4 bg-gray-100 rounded"></div>
                    </div>
                </div>
            </header>

            {/* Content Skeleton */}
            <div className="space-y-6">
                <div className="w-full h-80 bg-gray-200 rounded-xl mb-8"></div>
                <div className="space-y-4">
                    <div className="w-full h-5 bg-gray-100 rounded"></div>
                    <div className="w-full h-5 bg-gray-100 rounded"></div>
                    <div className="w-5/6 h-5 bg-gray-100 rounded"></div>
                    <div className="w-full h-5 bg-gray-100 rounded"></div>
                    <div className="w-4/5 h-5 bg-gray-100 rounded"></div>
                </div>
                <div className="space-y-4 pt-8">
                    <div className="w-full h-5 bg-gray-100 rounded"></div>
                    <div className="w-3/4 h-5 bg-gray-100 rounded"></div>
                </div>
            </div>
        </div>
    );
}
