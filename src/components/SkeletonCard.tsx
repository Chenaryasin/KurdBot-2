export default function SkeletonCard() {
  return (
    <div className="glass-card p-4 rounded-2xl flex flex-col gap-4 border border-gray-150 dark:border-gray-800">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 shimmer rounded-2xl flex-shrink-0"></div>
        <div className="flex-1 space-y-3">
          <div className="h-4 shimmer rounded w-3/4 mr-auto"></div>
          <div className="h-3 shimmer rounded w-1/2 mr-auto"></div>
          <div className="h-3 shimmer rounded w-5/6 mr-auto mt-2"></div>
        </div>
      </div>
      <div className="flex gap-2 mt-2">
        <div className="flex-1 h-10 shimmer rounded-xl"></div>
        <div className="flex-1 h-10 shimmer rounded-xl"></div>
      </div>
    </div>
  );
}
