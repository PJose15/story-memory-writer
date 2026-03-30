import type { CanonStatus, DataSource } from '@/lib/store';

// ─── Entity Types ───

export type EntityType = 'character' | 'location' | 'event' | 'conflict';

export interface EntityCatalogEntry {
  id: string;
  name: string;
  type: EntityType;
  mentionCount: number;
  firstAppearanceChapter: number; // 0-based index
  lastAppearanceChapter: number;
  sceneIds: string[];
  canonStatus?: CanonStatus;
  source?: DataSource;
  /** For characters: relationship count */
  relationshipCount: number;
}

export interface RelationshipPair {
  sourceId: string;
  sourceName: string;
  targetId: string;
  targetName: string;
  trustLevel: number;   // 0-100
  tensionLevel: number; // 0-100
  dynamics: string;
}

export interface StoryBrainAnalysis {
  entities: EntityCatalogEntry[];
  relationships: RelationshipPair[];
  totalMentions: number;
  entityCountByType: Record<EntityType, number>;
}

// ─── Inconsistency Types ───

export type InconsistencySeverity = 'low' | 'medium' | 'high' | 'critical';

export type InconsistencyType =
  | 'timeline_conflict'
  | 'character_gap'
  | 'relationship_asymmetry'
  | 'orphaned_reference'
  | 'unresolved_tension';

export interface Inconsistency {
  id: string;
  type: InconsistencyType;
  severity: InconsistencySeverity;
  title: string;
  description: string;
  relatedEntityIds: string[];
  chapterIds: string[];
}

// ─── Resolution Types ───

export type ResolutionAction = 'ignore' | 'correct' | 'intentional';

export interface InconsistencyResolution {
  inconsistencyId: string;
  action: ResolutionAction;
  resolvedAt: string; // ISO timestamp
}
