// src/app/(public)/news/[category]/loading.tsx
export default function CategoryLoading() {
    return (
        <div className="container mx-auto px-4 py-8 animate-pulse">
            {/* Title Skeleton */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 border-b-2 border-gray-100 pb-6">
                <div className="w-48 h-10 bg-gray-200 rounded-lg"></div>
                <div className="w-32 h-6 bg-gray-100 rounded"></div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* News List Skeleton */}
                <div className="flex-1 space-y-6">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex flex-col md:flex-row gap-6 p-4 rounded-xl border border-gray-100">
                            <div className="w-full md:w-64 h-40 bg-gray-200 rounded-xl shrink-0"></div>
                            <div className="flex-1 space-y-4 py-2">
                                <div className="w-3/4 h-6 bg-gray-200 rounded"></div>
                                <div className="w-full h-4 bg-gray-100 rounded"></div>
                                <div className="w-1/2 h-4 bg-gray-100 rounded"></div>
                                <div className="flex gap-4 pt-2">
                                    <div className="w-20 h-4 bg-gray-50 rounded"></div>
                                    <div className="w-20 h-4 bg-gray-50 rounded"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Sidebar Skeleton */}
                <aside className="w-full lg:w-96 space-y-8">
                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                        <div className="w-32 h-6 bg-gray-200 rounded mb-6"></div>
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="w-16 h-16 bg-gray-200 rounded-lg shrink-0"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="w-full h-4 bg-gray-200 rounded"></div>
                                        <div className="w-1/2 h-3 bg-gray-100 rounded"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
