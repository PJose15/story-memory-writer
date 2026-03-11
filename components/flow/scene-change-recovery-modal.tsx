'use client';

interface SceneChangeRecoveryModalProps {
  originalChapterTitle: string;
  onReturn: () => void;
  onStayHere: () => void;
}

export function SceneChangeRecoveryModal({
  originalChapterTitle,
  onReturn,
  onStayHere,
}: SceneChangeRecoveryModalProps) {
  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="recovery-title"
      aria-describedby="recovery-message"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="space-y-4">
          <div className="text-center">
            <span className="text-3xl" aria-hidden="true">&#x1F500;</span>
          </div>
          <h3 id="recovery-title" className="text-lg font-serif font-semibold text-zinc-100 text-center">
            Scene Change Expired
          </h3>
          <p id="recovery-message" className="text-sm text-zinc-400 text-center leading-relaxed">
            Your scene change timer ran out while you were away. Return to <strong className="text-zinc-300">{originalChapterTitle}</strong>?
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={onStayHere}
              className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              Stay here
            </button>
            <button
              onClick={onReturn}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
            >
              Return to original
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
