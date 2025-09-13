import { encoding_for_model } from 'tiktoken';
import { Node, Tree } from './tree_structures';
import { BaseEmbeddingModel, OpenAIEmbeddingModel } from './models';
import {
  reverseMapping,
  getNodeList,
  getEmbeddings,
  getText,
  distancesFromEmbeddings,
  indicesOfNearestNeighborsFromDistances
} from './utils';

export class TreeRetrieverConfig {
  tokenizer: any;
  threshold: number;
  topK: number;
  selectionMode: 'top_k' | 'threshold';
  contextEmbeddingModel: string;
  embeddingModel: BaseEmbeddingModel;
  numLayers: number | undefined;
  startLayer: number | undefined;

  constructor(params: Partial<TreeRetrieverConfig> = {}) {
    this.tokenizer = params.tokenizer || encoding_for_model('gpt-3.5-turbo');
    this.threshold = params.threshold || 0.5;
    this.topK = params.topK || 5;
    this.selectionMode = params.selectionMode || 'top_k';
    this.contextEmbeddingModel = params.contextEmbeddingModel || 'OpenAI';
    this.embeddingModel = params.embeddingModel || new OpenAIEmbeddingModel();
    this.numLayers = params.numLayers;
    this.startLayer = params.startLayer;
  }
}

export class TreeRetriever {
  private tree: Tree;
  private numLayers: number;
  private startLayer: number;
  private tokenizer: any;
  private topK: number;
  private threshold: number;
  private selectionMode: 'top_k' | 'threshold';
  private embeddingModel: BaseEmbeddingModel;
  private contextEmbeddingModel: string;
  private treeNodeIndexToLayer: Map<number, number>;

  constructor(config: TreeRetrieverConfig, tree: Tree) {
    this.tree = tree;
    this.numLayers = config.numLayers !== undefined ? config.numLayers : tree.numLayers + 1;
    this.startLayer = config.startLayer !== undefined ? config.startLayer : tree.numLayers;
    this.tokenizer = config.tokenizer;
    this.topK = config.topK;
    this.threshold = config.threshold;
    this.selectionMode = config.selectionMode;
    this.embeddingModel = config.embeddingModel;
    this.contextEmbeddingModel = config.contextEmbeddingModel;
    this.treeNodeIndexToLayer = reverseMapping(tree.layerToNodes);
  }

  async createEmbedding(text: string): Promise<number[]> {
    return this.embeddingModel.createEmbedding(text);
  }

  async retrieveInformationCollapseTree(
    query: string,
    topK: number,
    maxTokens: number
  ): Promise<[Node[], string]> {
    const queryEmbedding = await this.createEmbedding(query);
    const selectedNodes: Node[] = [];
    const nodeList = getNodeList(this.tree.allNodes);
    const embeddings = getEmbeddings(nodeList, this.contextEmbeddingModel);
    const distances = distancesFromEmbeddings(queryEmbedding, embeddings);
    const indices = indicesOfNearestNeighborsFromDistances(distances);
    
    let totalTokens = 0;
    for (const idx of indices.slice(0, topK)) {
      const node = nodeList[idx];
      if (!node) continue; // Skip if node is undefined
      
      const nodeTokens = this.tokenizer.encode(node.text).length;
      
      if (totalTokens + nodeTokens > maxTokens) break;
      
      selectedNodes.push(node);
      totalTokens += nodeTokens;
    }
    
    const context = getText(selectedNodes);
    return [selectedNodes, context];
  }

  // Overloaded method signatures
  async retrieve(query: string): Promise<string>;
  async retrieve(
    query: string,
    startLayer?: number,
    numLayers?: number,
    topK?: number,
    maxTokens?: number,
    collapseTree?: boolean,
    returnLayerInformation?: false
  ): Promise<string>;
  async retrieve(
    query: string,
    startLayer?: number,
    numLayers?: number,
    topK?: number,
    maxTokens?: number,
    collapseTree?: boolean,
    returnLayerInformation?: true
  ): Promise<[string, any[]]>;
  async retrieve(
    query: string,
    startLayer?: number,
    numLayers?: number,
    topK: number = 10,
    maxTokens: number = 3500,
    collapseTree: boolean = true,
    returnLayerInformation: boolean = false
  ): Promise<string | [string, any[]]> {
    startLayer = startLayer ?? this.startLayer;
    numLayers = numLayers ?? this.numLayers;
    
    let selectedNodes: Node[];
    let context: string;
    
    if (collapseTree) {
      console.log('Using collapsed_tree');
      [selectedNodes, context] = await this.retrieveInformationCollapseTree(query, topK, maxTokens);
    } else {
      const layerNodes = this.tree.layerToNodes.get(startLayer);
      if (!layerNodes) {
        throw new Error(`No nodes found for layer ${startLayer}`);
      }
      [selectedNodes, context] = await this.retrieveInformation(layerNodes, query, numLayers);
    }
    
    if (returnLayerInformation) {
      const layerInformation = selectedNodes.map(node => ({
        node_index: node.index,
        layer_number: this.treeNodeIndexToLayer.get(node.index),
      }));
      return [context, layerInformation];
    }
    
    return context;
  }

  private async retrieveInformation(
    currentNodes: Node[],
    query: string,
    numLayers: number
  ): Promise<[Node[], string]> {
    const queryEmbedding = await this.createEmbedding(query);
    const selectedNodes: Node[] = [];
    let nodeList = currentNodes;
    
    for (let layer = 0; layer < numLayers; layer++) {
      const embeddings = getEmbeddings(nodeList, this.contextEmbeddingModel);
      const distances = distancesFromEmbeddings(queryEmbedding, embeddings);
      const indices = indicesOfNearestNeighborsFromDistances(distances);
      
      let bestIndices: number[];
      if (this.selectionMode === 'threshold') {
        bestIndices = indices.filter(index => distances[index] > this.threshold);
      } else {
        bestIndices = indices.slice(0, this.topK);
      }
      
      const nodesToAdd = bestIndices.map(idx => nodeList[idx]).filter(node => node !== undefined) as Node[];
      selectedNodes.push(...nodesToAdd);
      
      if (layer !== numLayers - 1) {
        const childNodes = new Set<number>();
        for (const idx of bestIndices) {
          const node = nodeList[idx];
          if (node) {
            node.children.forEach(child => childNodes.add(child));
          }
        }
        nodeList = Array.from(childNodes)
          .map(i => this.tree.allNodes.get(i))
          .filter(node => node !== undefined) as Node[];
      }
    }
    
    const context = getText(selectedNodes);
    return [selectedNodes, context];
  }
}