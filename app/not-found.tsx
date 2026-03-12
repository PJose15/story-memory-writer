import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <h2 className="text-2xl font-serif font-semibold text-sepia-900 mb-2">Page Not Found</h2>
      <p className="text-sepia-600 mb-6">The page you are looking for does not exist.</p>
      <Link
        href="/"
        className="px-4 py-2 bg-parchment-200 hover:bg-parchment-300 text-sepia-900 rounded-lg transition-colors text-sm font-medium"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
