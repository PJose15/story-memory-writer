'use client';

import { useState } from 'react';
import { CarvedHeader, ParchmentCard } from '@/components/antiquarian';
import { useStoryBrain } from '@/hooks/use-story-brain';
import { EntityCatalog } from '@/components/story-brain/entity-catalog';
import { EntityDetailCard } from '@/components/story-brain/entity-detail-card';
import { InconsistencyAlert } from '@/components/story-brain/inconsistency-alert';
import { RelationshipMatrix } from '@/components/story-brain/relationship-matrix';
import { PlotHolePanel } from '@/components/story-brain/plot-hole-panel';
import type { EntityCatalogEntry } from '@/lib/story-brain/types';

type Tab = 'entities' | 'relationships' | 'alerts' | 'plot-holes';

export default function StoryBrainPage() {
  const {
    analysis,
    inconsistencies,
    plotHoles,
    resolutions,
    unresolvedCount,
    unresolvedPlotHoleCount,
    resolve,
    unresolve,
  } = useStoryBrain();

  const [activeTab, setActiveTab] = useState<Tab>('entities');
  const [selectedEntity, setSelectedEntity] = useState<EntityCatalogEntry | null>(null);

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: 'entities', label: 'Entities', badge: analysis.entities.length },
    { id: 'relationships', label: 'Relationships', badge: analysis.relationships.length },
    { id: 'alerts', label: 'Alerts', badge: unresolvedCount },
    { id: 'plot-holes', label: 'Plot Holes', badge: unresolvedPlotHoleCount },
  ];

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <CarvedHeader
        title="Story Brain"
        subtitle={`${analysis.entities.length} entities tracked — ${unresolvedCount + unresolvedPlotHoleCount} issues need attention`}
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ParchmentCard padding="sm">
          <span className="text-[10px] text-sepia-400 block">Characters</span>
          <span className="text-lg font-mono text-sepia-800">{analysis.entityCountByType.character}</span>
        </ParchmentCard>
        <ParchmentCard padding="sm">
          <span className="text-[10px] text-sepia-400 block">Locations</span>
          <span className="text-lg font-mono text-sepia-800">{analysis.entityCountByType.location}</span>
        </ParchmentCard>
        <ParchmentCard padding="sm">
          <span className="text-[10px] text-sepia-400 block">Relationships</span>
          <span className="text-lg font-mono text-sepia-800">{analysis.relationships.length}</span>
        </ParchmentCard>
        <ParchmentCard padding="sm">
          <span className="text-[10px] text-sepia-400 block">Total Mentions</span>
          <span className="text-lg font-mono text-sepia-800">{analysis.totalMentions}</span>
        </ParchmentCard>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 border-b border-sepia-300/30 pb-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors relative ${
              activeTab === tab.id
                ? 'bg-parchment-100 text-sepia-900 border border-sepia-300/30 border-b-transparent -mb-px'
                : 'text-sepia-500 hover:text-sepia-700 hover:bg-parchment-200/50'
            }`}
          >
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className={`ml-1.5 text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                tab.id === 'alerts' || tab.id === 'plot-holes'
                  ? 'bg-wax-500/10 text-wax-600'
                  : 'bg-brass-500/10 text-brass-600'
              }`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'entities' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={selectedEntity ? 'lg:col-span-2' : 'lg:col-span-3'}>
              <EntityCatalog
                entities={analysis.entities}
                onSelect={setSelectedEntity}
              />
            </div>
            {selectedEntity && (
              <div>
                <EntityDetailCard
                  entity={selectedEntity}
                  relationships={analysis.relationships}
                  onClose={() => setSelectedEntity(null)}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'relationships' && (
          <ParchmentCard padding="lg">
            <RelationshipMatrix relationships={analysis.relationships} />
          </ParchmentCard>
        )}

        {activeTab === 'alerts' && (
          <div className="space-y-2">
            {inconsistencies.length === 0 ? (
              <p className="text-sm text-sepia-500 text-center py-8">No inconsistencies detected. Your story is clean!</p>
            ) : (
              inconsistencies.map(inc => (
                <InconsistencyAlert
                  key={inc.id}
                  inconsistency={inc}
                  resolution={resolutions.find(r => r.inconsistencyId === inc.id)}
                  onResolve={resolve}
                  onUnresolve={unresolve}
                />
              ))
            )}
          </div>
        )}

        {activeTab === 'plot-holes' && (
          <PlotHolePanel
            plotHoles={plotHoles}
            resolutions={resolutions}
            onResolve={resolve}
            onUnresolve={unresolve}
          />
        )}
      </div>
    </div>
  );
}
