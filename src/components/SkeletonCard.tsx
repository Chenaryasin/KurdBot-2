export default function SkeletonCard() {
  return (
    <div className="glass-card p-4 rounded-2xl flex flex-col gap-4 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-2xl flex-shrink-0"></div>
        <div className="flex-1 space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mr-auto"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mr-auto"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mr-auto mt-2"></div>
        </div>
      </div>
      <div className="flex gap-2 mt-2">
        <div className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
        <div className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
      </div>
    </div>
  );
}
