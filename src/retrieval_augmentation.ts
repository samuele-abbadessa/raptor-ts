// src/retrieval_augmentation.ts

import { Tree, SerializedTree } from './tree_structures';
import { TreeBuilder, TreeBuilderConfig } from './tree_builder';
import { ClusterTreeBuilder, ClusterTreeConfig } from './cluster_tree_builder';
import { TreeRetriever, TreeRetrieverConfig } from './tree_retriever';
import { BaseQAModel, GPT3TurboQAModel } from './models';
import { Document } from './document/types';
import { DocumentStorage, FileSystemDocumentStorage } from './document/storage';
import { CollectionStorage, FileSystemCollectionStorage } from './document/collection';
import { ChunkingStrategy, TokenBasedChunking } from './document/chunking';
import { IncrementalIndexer } from './indexing/incremental_indexer';
import { FileSystemIndexingStateStorage } from './indexing/state_storage';
import * as fs from 'fs';
import * as path from 'path';

export interface BatchAddOptions {
  collection?: string;
  chunkingStrategy?: ChunkingStrategy;
  parallelProcessing?: boolean;
  batchSize?: number;
}

export class RetrievalAugmentationConfig {
  treeBuilderConfig: TreeBuilderConfig | ClusterTreeConfig;
  treeRetrieverConfig: TreeRetrieverConfig;
  qaModel: BaseQAModel;
  treeBuilderType: string;

  constructor(params: Partial<RetrievalAugmentationConfig> = {}) {
    this.treeBuilderType = params.treeBuilderType || 'cluster';
    this.treeBuilderConfig = params.treeBuilderConfig || 
      (this.treeBuilderType === 'cluster' ? new ClusterTreeConfig() : new TreeBuilderConfig());
    this.treeRetrieverConfig = params.treeRetrieverConfig || new TreeRetrieverConfig();
    this.qaModel = params.qaModel || new GPT3TurboQAModel();
  }
}

export class RetrievalAugmentation {
  private tree: Tree | undefined;
  private treeBuilder: TreeBuilder;
  private treeRetrieverConfig: TreeRetrieverConfig;
  private qaModel: BaseQAModel;
  private retriever: TreeRetriever | undefined;
  private documentStorage: DocumentStorage;
  private collectionStorage: CollectionStorage;
  private incrementalIndexer: IncrementalIndexer;
  private currentIndexState?: string;

  constructor(config?: RetrievalAugmentationConfig, tree?: Tree | string) {
    config = config || new RetrievalAugmentationConfig();
    
    if (typeof tree === 'string') {
      // Load from file
      this.tree = RetrievalAugmentation.load(tree);
    } else {
      this.tree = tree;
    }
    
    // Use the appropriate builder based on type
    if (config.treeBuilderType === 'cluster') {
      this.treeBuilder = new ClusterTreeBuilder(config.treeBuilderConfig as ClusterTreeConfig);
    } else {
      // For non-cluster types, you'd need to implement a concrete TreeBuilder
      // Since TreeBuilder is abstract, we'll use ClusterTreeBuilder as default
      this.treeBuilder = new ClusterTreeBuilder(
        config.treeBuilderConfig instanceof ClusterTreeConfig 
          ? config.treeBuilderConfig 
          : new ClusterTreeConfig(config.treeBuilderConfig)
      );
    }
    
    this.treeRetrieverConfig = config.treeRetrieverConfig;
    this.qaModel = config.qaModel;
    
    // Initialize storage systems
    this.documentStorage = new FileSystemDocumentStorage();
    this.collectionStorage = new FileSystemCollectionStorage();
    this.incrementalIndexer = new IncrementalIndexer(
      new FileSystemIndexingStateStorage(),
      this.documentStorage,
      this.treeBuilder
    );
    
    if (this.tree) {
      this.retriever = new TreeRetriever(this.treeRetrieverConfig, this.tree);
    }
  }

  // New method for adding documents with the document system
  async addDocumentsBatch(
    documents: Array<Omit<Document, 'id'>>,
    options: BatchAddOptions = {}
  ): Promise<string[]> {
    const savedDocIds: string[] = [];
    const savedDocs: Document[] = [];
    
    // Process in batches if specified
    const batchSize = options.batchSize || documents.length;
    
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      
      // Save documents
      const batchDocs = await Promise.all(
        batch.map(async doc => {
          const id = await this.documentStorage.save(doc);
          savedDocIds.push(id);
          const saved = await this.documentStorage.get(id);
          if (!saved) throw new Error(`Failed to save document`);
          return saved;
        })
      );
      
      savedDocs.push(...batchDocs);
    }
    
    // Add to collection if specified
    if (options.collection) {
      let collectionId = options.collection;
      
      // Check if it's a collection name or ID
      if (!collectionId.startsWith('col_')) {
        // Create new collection
        collectionId = await this.collectionStorage.createCollection(
          options.collection
        );
      }
      
      await this.collectionStorage.addDocumentsToCollection(
        collectionId,
        savedDocIds
      );
    }
    
    // Load or create indexing state
    if (!this.currentIndexState) {
      const state = await this.incrementalIndexer.loadOrCreateState();
      this.currentIndexState = state.id;
    }
    
    // Perform incremental indexing
    this.tree = await this.incrementalIndexer.addDocuments(savedDocs);
    
    // Update retriever
    this.retriever = new TreeRetriever(this.treeRetrieverConfig, this.tree);
    
    return savedDocIds;
  }

  // Backward compatibility method
  async addDocuments(docs: string): Promise<void> {
    if (this.tree) {
      console.warn('Warning: Overwriting existing tree.');
    }
    
    // Convert string to document format for backward compatibility
    const document: Omit<Document, 'id'> = {
      content: docs,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        contentType: 'plain'
      }
    };
    
    await this.addDocumentsBatch([document]);
  }

  // Add a single document
  async addDocument(
    document: Omit<Document, 'id'>,
    options: BatchAddOptions = {}
  ): Promise<string> {
    const ids = await this.addDocumentsBatch([document], options);
    return ids[0];
  }

  // Add documents from a collection
  async addCollection(
    collectionId: string,
    options: BatchAddOptions = {}
  ): Promise<void> {
    const collection = await this.collectionStorage.getCollection(collectionId);
    if (!collection) throw new Error(`Collection ${collectionId} not found`);
    
    const documents = await Promise.all(
      Array.from(collection.documentIds).map(id => 
        this.documentStorage.get(id)
      )
    );
    
    const validDocs = documents.filter((d): d is Document => d !== null);
    
    // Load or create indexing state
    if (!this.currentIndexState) {
      const state = await this.incrementalIndexer.loadOrCreateState();
      this.currentIndexState = state.id;
    }
    
    // Use incremental indexer
    this.tree = await this.incrementalIndexer.addDocuments(validDocs);
    this.retriever = new TreeRetriever(this.treeRetrieverConfig, this.tree);
  }

  // Get indexing statistics
  async getIndexingStats(): Promise<{
    totalDocuments: number;
    totalTokens: number;
    lastUpdated: Date;
    reindexThreshold: number;
    documentsUntilReindex: number;
  }> {
    if (!this.currentIndexState) {
      throw new Error('No indexing state available');
    }
    
    const state = await this.incrementalIndexer.loadOrCreateState(
      this.currentIndexState
    );
    
    const threshold = state.config.reindexThresholdPercent;
    const maxNewTokens = (state.totalTokens * threshold) / 100;
    
    // Estimate documents until reindex (rough estimate)
    const avgTokensPerDoc = state.totalDocuments > 0 
      ? state.totalTokens / state.totalDocuments 
      : 100;
    const documentsUntilReindex = Math.floor(maxNewTokens / avgTokensPerDoc);
    
    return {
      totalDocuments: state.totalDocuments,
      totalTokens: state.totalTokens,
      lastUpdated: state.lastUpdatedAt,
      reindexThreshold: threshold,
      documentsUntilReindex
    };
  }

  // Force reindexing
  async forceReindex(): Promise<void> {
    if (!this.currentIndexState) {
      throw new Error('No indexing state available');
    }
    
    const state = await this.incrementalIndexer.loadOrCreateState(
      this.currentIndexState
    );
    
    this.tree = await this.incrementalIndexer.addDocuments([], true);
    this.retriever = new TreeRetriever(this.treeRetrieverConfig, this.tree);
  }

  async retrieve(
    question: string,
    startLayer?: number,
    numLayers?: number,
    topK: number = 10,
    maxTokens: number = 3500,
    collapseTree: boolean = true,
    returnLayerInformation: boolean = true
  ): Promise<string | [string, any[]]> {
    if (!this.retriever) {
      throw new Error("The TreeRetriever instance has not been initialized. Call 'addDocuments' first.");
    }
    
    return this.retriever.retrieve(
      question,
      startLayer,
      numLayers,
      topK,
      maxTokens,
      collapseTree,
      returnLayerInformation as any
    );
  }

  async answerQuestion(
    question: string,
    topK: number = 10,
    startLayer?: number,
    numLayers?: number,
    maxTokens: number = 3500,
    collapseTree: boolean = true,
    returnLayerInformation: boolean = false
  ): Promise<string | [string, any]> {
    const result = await this.retrieve(
      question,
      startLayer,
      numLayers,
      topK,
      maxTokens,
      collapseTree,
      true
    );
    
    const [context, layerInformation] = Array.isArray(result) ? result : [result, null];
    const answer = await this.qaModel.answerQuestion(context, question);
    
    if (returnLayerInformation) {
      return [answer, layerInformation];
    }
    
    return answer;
  }

  /**
   * Save the tree to a JSON file
   * @param filePath - Path where to save the tree
   */
  save(filePath: string): void {
    if (!this.tree) {
      throw new Error('There is no tree to save.');
    }
    
    try {
      // Convert the tree to a serializable format
      const serializedTree = this.tree.toJSON();
      
      // Create directory if it doesn't exist
      const dir = path.dirname(filePath);
      if (dir && dir !== '.' && !fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Save to file with pretty formatting
      fs.writeFileSync(filePath, JSON.stringify(serializedTree, null, 2), 'utf-8');
      console.log(`Tree saved successfully to ${filePath}`);
    } catch (error) {
      console.error('Error saving tree:', error);
      throw new Error(`Failed to save tree: ${error}`);
    }
  }

  /**
   * Load a tree from a JSON file
   * @param filePath - Path to the saved tree file
   * @returns The loaded Tree object
   */
  static load(filePath: string): Tree {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }
      
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const serializedTree: SerializedTree = JSON.parse(fileContent);
      
      // Reconstruct the tree from the serialized format
      const tree = Tree.fromJSON(serializedTree);
      console.log(`Tree loaded successfully from ${filePath}`);
      return tree;
    } catch (error) {
      console.error('Error loading tree:', error);
      throw new Error(`Failed to load tree: ${error}`);
    }
  }

  /**
   * Create a new RetrievalAugmentation instance from a saved tree file
   * @param filePath - Path to the saved tree file
   * @param config - Optional configuration for the RetrievalAugmentation instance
   * @returns A new RetrievalAugmentation instance with the loaded tree
   */
  static fromFile(filePath: string, config?: RetrievalAugmentationConfig): RetrievalAugmentation {
    const tree = RetrievalAugmentation.load(filePath);
    return new RetrievalAugmentation(config, tree);
  }

  /**
   * Get the current tree (useful for inspection or debugging)
   */
  getTree(): Tree | undefined {
    return this.tree;
  }

  /**
   * Check if a tree has been loaded or built
   */
  hasTree(): boolean {
    return this.tree !== undefined;
  }
}