'use client';

import { useState } from 'react';
import { useSession } from '@/lib/session';
import { ChapterSelectModal } from '@/components/flow/chapter-select-modal';
import { FlowEditor } from '@/components/flow/flow-editor';
import { useRouter } from 'next/navigation';

export default function FlowPage() {
  const { session, setFlowChapterId } = useSession();
  const router = useRouter();
  const [showSelect, setShowSelect] = useState(!session.flowChapterId);

  const handleSelectChapter = (chapterId: string) => {
    setFlowChapterId(chapterId);
    setShowSelect(false);
  };

  const handleExit = () => {
    setFlowChapterId(null);
    router.push('/manuscript');
  };

  const handleCloseSelect = () => {
    if (session.flowChapterId) {
      setShowSelect(false);
    } else {
      router.push('/');
    }
  };

  if (showSelect || !session.flowChapterId) {
    return (
      <div className="fixed inset-0 z-[100] bg-mahogany-950">
        <ChapterSelectModal
          onSelect={handleSelectChapter}
          onClose={handleCloseSelect}
        />
      </div>
    );
  }

  return <FlowEditor chapterId={session.flowChapterId} onExit={handleExit} />;
}
