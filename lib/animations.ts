/**
 * Zagafy — Animation Presets
 * Spring physics and choreography for the Antiquarian Library theme.
 * Designed for use with the Motion library (motion/react).
 */

/**
 * Zagafy Animation Presets
 *
 * Usage:
 * - springs.gentle → parchment-modal entrance
 * - stagger.cards → dashboard stat cards staggered entrance
 * - stagger.navItems → sidebar navigation items slide-in
 * - toastSlam → antiquarian toast entrance
 * - fadeUp → page section headers (characters, conflicts, canon)
 * - hoverLift → dashboard stat cards hover effect
 * - physicalDrop → new content items (chapters, open loops)
 * - stampSlam → reserved for canon status animations
 * - cardFlip → reserved for card flip interactions
 * - stagger.stampGrid → reserved for stamp grid layout
 */

// ─── Spring Physics Presets ───

export const springs = {
  /** Gentle placement — like setting a book on a shelf */
  gentle: { type: 'spring' as const, stiffness: 120, damping: 20 },
  /** Rubber stamp — quick, decisive press */
  stamp: { type: 'spring' as const, stiffness: 400, damping: 25 },
  /** Wax seal — firm press with slight bounce */
  seal: { type: 'spring' as const, stiffness: 300, damping: 15 },
  /** Heavy tome — slow, weighty motion */
  tome: { type: 'spring' as const, stiffness: 80, damping: 18 },
  /** Card flip — snappy and crisp */
  flip: { type: 'spring' as const, stiffness: 500, damping: 30 },
};

// ─── Stagger Choreography ───

export const stagger = {
  /** Cards fade in + slide up with rotateX tilt */
  cards: (index: number) => ({
    initial: { opacity: 0, y: 20, rotateX: -8 },
    animate: { opacity: 1, y: 0, rotateX: 0 },
    transition: { ...springs.gentle, delay: index * 0.06 },
  }),

  /** Nav items slide in from left */
  navItems: (index: number) => ({
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    transition: { ...springs.gentle, delay: index * 0.04 },
  }),

  /** Stamp grid — scale down from 1.3 with slight rotate */
  stampGrid: (index: number) => ({
    initial: { opacity: 0, scale: 1.3, rotate: -3 },
    animate: { opacity: 1, scale: 1, rotate: 0 },
    transition: { ...springs.stamp, delay: index * 0.05 },
  }),
};

// ─── Physical Animations ───

/** Stamp slam — decisive press onto surface */
export const stampSlam = {
  initial: { scale: 1.5, rotate: -5, opacity: 0 },
  animate: { scale: 1, rotate: 0, opacity: 1 },
  transition: springs.stamp,
};

/** Physical drop — element falls into place */
export const physicalDrop = {
  initial: { y: -100, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { type: 'spring' as const, stiffness: 200, damping: 30 },
};

/** Hover lift — subtle elevation on hover */
export const hoverLift = {
  whileHover: { y: -4, transition: { type: 'spring' as const, stiffness: 300, damping: 20 } },
};

/** Card flip — rotateY entrance */
export const cardFlip = {
  initial: { rotateY: -90, opacity: 0 },
  animate: { rotateY: 0, opacity: 1 },
  exit: { rotateY: 90, opacity: 0 },
  transition: springs.flip,
};

// ─── Utility Variants ───

/** Fade-up for general content entrance */
export const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 8 },
  transition: springs.gentle,
};

/** Toast slam — enters from above with stamp physics */
export const toastSlam = {
  initial: { opacity: 0, y: -40, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -20, scale: 0.95 },
  transition: springs.stamp,
};
