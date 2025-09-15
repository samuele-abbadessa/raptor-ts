// src/indexing/incremental_indexer.ts

import { v4 as uuidv4 } from 'uuid';
import { encoding_for_model } from 'tiktoken';
import { IndexingState, LayerState, ClusterInfo, IndexingConfig } from './types';
import { IndexingStateStorage } from './state_storage';
import { DocumentStorage } from '../document/storage';
import { Document, Chunk } from '../document/types';
import { TokenBasedChunking } from '../document/chunking';
import { Tree, Node, SerializedTree } from '../tree_structures';
import { TreeBuilder } from '../tree_builder';

export class IncrementalIndexer {
  private indexingState?: IndexingState;
  private stateStorage: IndexingStateStorage;
  private documentStorage: DocumentStorage;
  private treeBuilder: TreeBuilder;
  private tokenizer: any;
  
  constructor(
    stateStorage: IndexingStateStorage,
    documentStorage: DocumentStorage,
    treeBuilder: TreeBuilder
  ) {
    this.stateStorage = stateStorage;
    this.documentStorage = documentStorage;
    this.treeBuilder = treeBuilder;
    this.tokenizer = encoding_for_model('gpt-3.5-turbo');
  }

  async loadOrCreateState(stateId?: string): Promise<IndexingState> {
    if (stateId) {
      const state = await this.stateStorage.load(stateId);
      if (state) {
        this.indexingState = state;
        return state;
      }
    }
    
    // Create new state
    this.indexingState = {
      id: `idx_${uuidv4()}`,
      createdAt: new Date(),
      lastUpdatedAt: new Date(),
      totalTokens: 0,
      totalDocuments: 0,
      documentIds: [],
      layerStates: [],
      config: {
        reindexThresholdPercent: 10,
        maxIncrementalDocuments: 10,
        preserveClusteringInfo: true,
        chunkingStrategy: 'token-based'
      }
    };
    
    return this.indexingState;
  }

  async addDocuments(
    documents: Document[],
    forceReindex: boolean = false
  ): Promise<Tree> {
    if (!this.indexingState) {
      await this.loadOrCreateState();
    }
    
    const newTokenCount = this.calculateTokenCount(documents);
    const tokenIncreasePercent = this.indexingState!.totalTokens > 0
      ? (newTokenCount / this.indexingState!.totalTokens) * 100
      : 0;
    
    const shouldReindex = forceReindex ||
      tokenIncreasePercent > this.indexingState!.config.reindexThresholdPercent ||
      documents.length > this.indexingState!.config.maxIncrementalDocuments;
    
    if (shouldReindex && this.indexingState!.totalDocuments > 0) {
      return await this.reindexWithOptimization(documents);
    } else {
      return await this.incrementalIndex(documents);
    }
  }

  private async incrementalIndex(documents: Document[]): Promise<Tree> {
    console.log('Performing incremental indexing...');
    
    // Load existing tree if available
    let tree: Tree | undefined;
    if (this.indexingState!.treeSnapshot) {
      tree = Tree.fromJSON(this.indexingState!.treeSnapshot);
    }
    
    // Process new documents
    const chunks: Chunk[] = [];
    for (const doc of documents) {
      const docChunks = await this.chunkDocument(doc);
      chunks.push(...docChunks);
      this.indexingState!.documentIds.push(doc.id);
    }
    
    // Build tree from chunks
    if (!tree || chunks.length === 0) {
      // First indexing or no new chunks
      const chunkTexts = chunks.map(c => c.content).join('\n\n');
      tree = await this.treeBuilder.buildFromText(chunkTexts);
    } else {
      // Add new chunks to existing tree (simplified approach)
      // For now, rebuild the tree with all text
      const allDocuments = await this.loadDocuments(this.indexingState!.documentIds);
      const allText = allDocuments.map(d => d.content).join('\n\n');
      this.indexingState!.totalTokens = this.calculateTokenCount(allDocuments);
      tree = await this.treeBuilder.buildFromText(allText);
    }
    
    // Update state
    this.indexingState!.totalDocuments += documents.length;
    this.indexingState!.lastUpdatedAt = new Date();
    this.indexingState!.treeSnapshot = tree.toJSON();
    
    await this.stateStorage.save(this.indexingState!);
    
    return tree;
  }

  private async reindexWithOptimization(
    newDocuments: Document[]
  ): Promise<Tree> {
    console.log('Performing optimized reindexing...');
    
    // Load all documents
    const allDocIds = [
      ...this.indexingState!.documentIds,
      ...newDocuments.map(d => d.id)
    ];
    
    const allDocuments = await this.loadDocuments(allDocIds);
    
    // Build new tree
    const allText = allDocuments.map(d => d.content).join('\n\n');
    const tree = await this.treeBuilder.buildFromText(allText);
    
    // Update state
    this.indexingState!.totalTokens = this.calculateTokenCount(allDocuments);
    this.indexingState!.totalDocuments = allDocuments.length;
    this.indexingState!.documentIds = allDocIds;
    this.indexingState!.lastUpdatedAt = new Date();
    this.indexingState!.treeSnapshot = tree.toJSON();
    
    // Save layer states for future optimization
    this.indexingState!.layerStates = this.extractLayerStates(tree);
    
    await this.stateStorage.save(this.indexingState!);
    
    return tree;
  }

  private extractLayerStates(tree: Tree): LayerState[] {
    const layerStates: LayerState[] = [];
    
    tree.layerToNodes.forEach((nodes, layer) => {
      layerStates.push({
        layer,
        nodes: nodes.map(n => n.index)
      });
    });
    
    return layerStates;
  }

  private calculateTokenCount(documents: Document[]): number {
    return documents.reduce((sum, doc) => 
      sum + this.tokenizer.encode(doc.content).length, 0);
  }

  private async chunkDocument(document: Document): Promise<Chunk[]> {
    const strategy = new TokenBasedChunking({ 
      maxTokens: this.treeBuilder.maxTokens,
      tokenizer: this.tokenizer
    });
    return strategy.chunk(document);
  }

  private async loadDocuments(ids: string[]): Promise<Document[]> {
    const docs = await Promise.all(
      ids.map(id => this.documentStorage.get(id))
    );
    return docs.filter((d): d is Document => d !== null);
  }
}