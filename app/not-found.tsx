import Link from 'next/link';
import { EmptyState } from '@/components/antiquarian';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <EmptyState variant="generic" title="Page Not Found" subtitle="This scroll has been lost to the archives." action={{ label: 'Back to Dashboard', href: '/' }} />
    </div>
  );
}
