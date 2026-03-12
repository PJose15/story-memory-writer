'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <h2 className="text-2xl font-serif font-semibold text-sepia-900 mb-2">Something went wrong</h2>
      <p className="text-sepia-600 mb-6">An unexpected error occurred. Your data is safe in your browser.</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-parchment-200 hover:bg-parchment-300 text-sepia-900 rounded-lg transition-colors text-sm font-medium"
      >
        Try again
      </button>
    </div>
  );
}
