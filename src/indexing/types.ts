// src/indexing/types.ts

import { SerializedTree } from '../tree_structures';

export interface IndexingState {
  id: string;
  createdAt: Date;
  lastUpdatedAt: Date;
  totalTokens: number;
  totalDocuments: number;
  documentIds: string[];
  treeSnapshot?: SerializedTree;
  layerStates: LayerState[];
  config: IndexingConfig;
}

export interface LayerState {
  layer: number;
  nodes: number[];
  clusters?: ClusterInfo[];
  embeddings?: number[][];  // Cached embeddings for reuse
}

export interface ClusterInfo {
  nodeIndices: number[];
  centroid?: number[];
  variance?: number;
}

export interface IndexingConfig {
  reindexThresholdPercent: number;  // e.g., 10 for 10%
  maxIncrementalDocuments: number;   // Max docs before forcing reindex
  preserveClusteringInfo: boolean;
  chunkingStrategy: string;
}