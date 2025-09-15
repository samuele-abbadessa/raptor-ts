// src/index.ts

export { 
  Node, 
  Tree, 
  Embeddings,
  SerializedNode,
  SerializedTree,
  DocumentReferenceNode
} from './tree_structures';

export {
  BaseEmbeddingModel,
  BaseSummarizationModel,
  BaseQAModel,
  BaseRetriever,
  OpenAIEmbeddingModel,
  SBertEmbeddingModel,
  GPT3TurboSummarizationModel,
  GPT3SummarizationModel,
  GPT3TurboQAModel,
  GPT4QAModel,
  GPT3QAModel
} from './models';

export { TreeBuilder, TreeBuilderConfig } from './tree_builder';
export { ClusterTreeBuilder, ClusterTreeConfig } from './cluster_tree_builder';
export { TreeRetriever, TreeRetrieverConfig } from './tree_retriever';
export { ClusteringAlgorithm, RAPTORClustering } from './clustering';
export { 
  RetrievalAugmentation, 
  RetrievalAugmentationConfig,
  BatchAddOptions
} from './retrieval_augmentation';

// Document management exports
export {
  Document,
  DocumentMetadata,
  DocumentReference,
  Chunk,
  DocumentInfo
} from './document/types';

export {
  DocumentStorage,
  DocumentQuery,
  FileSystemDocumentStorage
} from './document/storage';

export {
  ChunkingStrategy,
  ChunkingOptions,
  TokenBasedChunking
} from './document/chunking';

export {
  DocumentCollection,
  CollectionStorage,
  FileSystemCollectionStorage
} from './document/collection';

// Indexing exports
export {
  IndexingState,
  LayerState,
  ClusterInfo,
  IndexingConfig
} from './indexing/types';

export {
  IncrementalIndexer
} from './indexing/incremental_indexer';

export {
  IndexingStateStorage,
  FileSystemIndexingStateStorage
} from './indexing/state_storage';

// Utility exports
export * from './utils';