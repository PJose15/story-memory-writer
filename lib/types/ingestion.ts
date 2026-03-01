export type IngestionSchema = {
  project: {
    project_id: string;
    title: string;
    genre: string[];
    tone_profile: string[];
    narrative_pov: string;
    source_type: 'new_project' | 'update_existing';
    summary_global: string;
  };
  source_files: {
    file_id: string;
    file_name: string;
    file_type: 'pdf' | 'doc' | 'docx' | 'txt' | 'md' | 'other';
    import_order: number;
    parse_status: 'success' | 'partial' | 'failed';
    notes: string;
  }[];
  manuscript: {
    total_chapters_detected: number;
    total_scenes_detected: number;
    has_provisional_boundaries: boolean;
    global_summary: string;
  };
  chapters: {
    chapter_id: string;
    chapter_number: number;
    title: string;
    source_file_id: string;
    order_index: number;
    is_provisional: boolean;
    summary: string;
    key_events: string[];
    characters_present: string[];
    locations_present: string[];
    conflicts_active: string[];
    open_loops_touched: string[];
    tone_shift: string;
    raw_text_reference: string;
  }[];
  scenes: {
    scene_id: string;
    chapter_id: string;
    order_index: number;
    is_inferred: boolean;
    summary: string;
    purpose: string;
    emotional_tone: string;
    key_change: string;
    characters_present: string[];
    location_id: string;
    timeline_event_ids: string[];
  }[];
  characters: {
    character_id: string;
    name: string;
    aliases: string[];
    role: string;
    description: string;
    core_traits: string[];
    confirmed_facts: string[];
    first_appearance_chapter_id: string;
    knowledge_scope: string[];
  }[];
  character_states: {
    state_id: string;
    character_id: string;
    chapter_id: string;
    scene_id: string;
    emotional_state: string;
    visible_goal: string;
    hidden_need: string;
    current_fear: string;
    dominant_belief: string;
    emotional_wound: string;
    recent_internal_shift: string;
    pressure_level: 'low' | 'medium' | 'high' | 'extreme';
    current_knowledge: string[];
    confidence: 'high' | 'medium' | 'low';
  }[];
  relationships: {
    relationship_id: string;
    character_a_id: string;
    character_b_id: string;
    relationship_type: string;
    trust_level: 'low' | 'medium' | 'high';
    tension_level: 'low' | 'medium' | 'high';
    current_status: string;
    recent_change: string;
  }[];
  timeline_events: {
    timeline_event_id: string;
    chapter_id: string;
    scene_id: string;
    event: string;
    cause: string;
    immediate_effect: string;
    latent_effect: string;
    is_confirmed: boolean;
  }[];
  plot_points: {
    plot_point_id: string;
    type: 'setup' | 'escalation' | 'reveal' | 'reversal' | 'climax' | 'fallout' | 'other';
    description: string;
    chapter_id: string;
    related_conflict_ids: string[];
    importance: 'low' | 'medium' | 'high';
  }[];
  active_conflicts: {
    conflict_id: string;
    conflict_type: 'internal' | 'interpersonal' | 'external' | 'world' | 'mystery' | 'other';
    description: string;
    characters_involved: string[];
    status: 'open' | 'escalating' | 'paused' | 'resolved';
    stakes: string;
  }[];
  open_loops: {
    loop_id: string;
    description: string;
    introduced_in_chapter_id: string;
    status: 'open' | 'partially_answered' | 'resolved';
    related_foreshadowing_ids: string[];
  }[];
  foreshadowing_elements: {
    foreshadowing_id: string;
    description: string;
    seeded_in_chapter_id: string;
    payoff_status: 'unpaid' | 'partial' | 'paid';
  }[];
  world_rules: {
    world_rule_id: string;
    rule: string;
    scope: 'local' | 'book' | 'series' | 'universe';
    is_confirmed: boolean;
  }[];
  locations: {
    location_id: string;
    name: string;
    description: string;
    importance: 'low' | 'medium' | 'high';
    associated_rules: string[];
  }[];
  themes: {
    theme_id: string;
    theme: string;
    evidence: string[];
  }[];
  canon_items: {
    canon_item_id: string;
    category: 'character' | 'event' | 'world_rule' | 'relationship' | 'reveal' | 'plot' | 'other';
    description: string;
    status: 'confirmed_canon' | 'flexible_canon' | 'draft_idea' | 'discarded';
    source_reference: string;
  }[];
  ambiguities: {
    ambiguity_id: string;
    issue: string;
    affected_section: string;
    confidence: 'low' | 'medium';
    recommended_review: string;
  }[];
};
