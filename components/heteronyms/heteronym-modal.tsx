'use client';

import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { AvatarCircle } from './avatar-circle';
import type { Heteronym } from '@/lib/types/heteronym';

const COLOR_SWATCHES = [
  '#E74C3C', '#E67E22', '#F1C40F', '#2ECC71', '#1ABC9C', '#3498DB',
  '#9B59B6', '#E91E63', '#00BCD4', '#8BC34A', '#FF5722', '#607D8B',
];

const EMOJI_OPTIONS = [
  '✍️', '📝', '🖊️', '🎭', '🌙', '🔥', '⚡', '🌊', '🌿', '🦋', '👁️', '🎪',
  '🗡️', '🌹', '🦅', '🌑', '💀', '🎠', '🧪', '🔮', '🌀', '🎯', '🦁', '🐺',
];

interface HeteronymModalProps {
  heteronym?: Heteronym | null;
  onSave: (data: { name: string; bio: string; styleNote: string; avatarColor: string; avatarEmoji: string }) => void;
  onClose: () => void;
}

export function HeteronymModal({ heteronym, onSave, onClose }: HeteronymModalProps) {
  const [name, setName] = useState(heteronym?.name || '');
  const [bio, setBio] = useState(heteronym?.bio || '');
  const [styleNote, setStyleNote] = useState(heteronym?.styleNote || '');
  const [avatarColor, setAvatarColor] = useState(heteronym?.avatarColor || COLOR_SWATCHES[0]);
  const [avatarEmoji, setAvatarEmoji] = useState(heteronym?.avatarEmoji || '✍️');
  const [nameError, setNameError] = useState('');
  const [customEmoji, setCustomEmoji] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError('Name is required');
      return;
    }
    onSave({
      name: trimmedName,
      bio: bio.trim(),
      styleNote: styleNote.trim(),
      avatarColor,
      avatarEmoji,
    });
  };

  const handleCustomEmojiChange = (value: string) => {
    setCustomEmoji(value);
    // Extract the last emoji-like character
    const emojis = [...value];
    if (emojis.length > 0) {
      setAvatarEmoji(emojis[emojis.length - 1]);
    }
  };

  const isEditing = !!heteronym;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[110] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-label={isEditing ? 'Edit heteronym' : 'Create heteronym'}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between p-6 border-b border-zinc-800">
            <h2 className="text-lg font-serif font-semibold text-zinc-100">
              {isEditing ? 'Edit Alter Ego' : 'New Alter Ego'}
            </h2>
            <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Live Preview */}
            <div className="flex items-center gap-3 pb-4 border-b border-zinc-800">
              <AvatarCircle color={avatarColor} emoji={avatarEmoji} size={48} />
              <div>
                <p className="text-zinc-100 font-medium">{name || 'Unnamed'}</p>
                <p className="text-xs text-zinc-500">{styleNote || 'No style note'}</p>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Name *</label>
              <input
                ref={nameInputRef}
                type="text"
                value={name}
                onChange={(e) => {
                  const v = e.target.value.slice(0, 30);
                  setName(v);
                  if (v.trim()) setNameError('');
                }}
                maxLength={30}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-indigo-500"
                placeholder="e.g. Álvaro de Campos"
              />
              <div className="flex justify-between mt-1">
                {nameError ? (
                  <p className="text-xs text-red-400">{nameError}</p>
                ) : (
                  <span />
                )}
                <span className="text-xs text-zinc-500">{name.length}/30</span>
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 150))}
                maxLength={150}
                rows={2}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 resize-none focus:outline-none focus:border-indigo-500"
                placeholder="Who is this writer? Where do they come from?"
              />
              <p className="text-xs text-zinc-500 text-right mt-1">{bio.length}/150</p>
            </div>

            {/* Style Note */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Style Note</label>
              <textarea
                value={styleNote}
                onChange={(e) => setStyleNote(e.target.value.slice(0, 200))}
                maxLength={200}
                rows={2}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 resize-none focus:outline-none focus:border-indigo-500"
                placeholder="How do they write? e.g. 'Fragmented sentences, raw emotion, no punctuation'"
              />
              <p className="text-xs text-zinc-500 text-right mt-1">{styleNote.length}/200</p>
            </div>

            {/* Avatar Color */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Avatar Color</label>
              <div className="flex flex-wrap gap-2">
                {COLOR_SWATCHES.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setAvatarColor(color)}
                    className={`w-8 h-8 rounded-full transition-all ${
                      avatarColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-110' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Color ${color}`}
                  />
                ))}
                <label className="w-8 h-8 rounded-full border-2 border-dashed border-zinc-600 flex items-center justify-center cursor-pointer hover:border-zinc-400 transition-colors relative overflow-hidden">
                  <span className="text-xs text-zinc-500">+</span>
                  <input
                    type="color"
                    value={avatarColor}
                    onChange={(e) => setAvatarColor(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    aria-label="Custom color"
                  />
                </label>
              </div>
            </div>

            {/* Avatar Emoji */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Avatar Emoji</label>
              <div className="grid grid-cols-8 gap-1.5 mb-2">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setAvatarEmoji(emoji)}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all ${
                      avatarEmoji === emoji
                        ? 'bg-zinc-700 ring-2 ring-indigo-500'
                        : 'hover:bg-zinc-800'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">Or type:</span>
                <input
                  type="text"
                  value={customEmoji}
                  onChange={(e) => handleCustomEmojiChange(e.target.value)}
                  className="w-16 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-center text-lg focus:outline-none focus:border-indigo-500"
                  placeholder="🎭"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
              >
                {isEditing ? 'Save Changes' : 'Create Alter Ego'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
