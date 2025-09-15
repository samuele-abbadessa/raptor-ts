import { encoding_for_model } from 'tiktoken';
import { 
  Node, 
  Tree, 
  Embeddings 
} from './tree_structures';
import {
  BaseEmbeddingModel,
  BaseSummarizationModel,
  OpenAIEmbeddingModel,
  GPT3TurboSummarizationModel
} from './models';
import {
  splitText,
  getNodeList,
  getText
} from './utils';

export class TreeBuilderConfig {
  tokenizer: any;
  maxTokens: number;
  numLayers: number;
  threshold: number;
  topK: number;
  selectionMode: 'top_k' | 'threshold';
  summarizationLength: number;
  summarizationModel: BaseSummarizationModel;
  embeddingModels: Map<string, BaseEmbeddingModel>;
  clusterEmbeddingModel: string;

  constructor(params: Partial<TreeBuilderConfig> = {}) {
    this.tokenizer = params.tokenizer || encoding_for_model('gpt-3.5-turbo');
    this.maxTokens = params.maxTokens || 100;
    this.numLayers = params.numLayers || 5;
    this.threshold = params.threshold || 0.5;
    this.topK = params.topK || 5;
    this.selectionMode = params.selectionMode || 'top_k';
    this.summarizationLength = params.summarizationLength || 100;
    this.summarizationModel = params.summarizationModel || new GPT3TurboSummarizationModel();
    this.embeddingModels = params.embeddingModels || new Map([['OpenAI', new OpenAIEmbeddingModel()]]);
    this.clusterEmbeddingModel = params.clusterEmbeddingModel || 'OpenAI';
  }
}

export abstract class TreeBuilder {
  protected tokenizer: any;
  public maxTokens: number;
  protected numLayers: number;
  protected topK: number;
  protected threshold: number;
  protected selectionMode: 'top_k' | 'threshold';
  protected summarizationLength: number;
  protected summarizationModel: BaseSummarizationModel;
  protected embeddingModels: Map<string, BaseEmbeddingModel>;
  protected clusterEmbeddingModel: string;

  constructor(config: TreeBuilderConfig) {
    this.tokenizer = config.tokenizer;
    this.maxTokens = config.maxTokens;
    this.numLayers = config.numLayers;
    this.topK = config.topK;
    this.threshold = config.threshold;
    this.selectionMode = config.selectionMode;
    this.summarizationLength = config.summarizationLength;
    this.summarizationModel = config.summarizationModel;
    this.embeddingModels = config.embeddingModels;
    this.clusterEmbeddingModel = config.clusterEmbeddingModel;
  }

  async createNode(
    index: number,
    text: string,
    childrenIndices?: Set<number>
  ): Promise<[number, Node]> {
    const children = childrenIndices || new Set<number>();
    const embeddings: Embeddings = {};
    
    for (const [modelName, model] of this.embeddingModels.entries()) {
      embeddings[modelName] = await model.createEmbedding(text);
    }
    
    return [index, new Node(text, index, children, embeddings)];
  }

  async summarize(context: string, maxTokens: number = 150): Promise<string> {
    return this.summarizationModel.summarize(context, maxTokens);
  }

  async buildFromText(text: string): Promise<Tree> {
    const chunks = splitText(text, this.tokenizer, this.maxTokens);
    console.log('Creating Leaf Nodes');
    
    const leafNodes = new Map<number, Node>();
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (chunk) {  // Ensure chunk is defined
        const [index, node] = await this.createNode(i, chunk);
        leafNodes.set(index, node);
      }
    }
    
    const layerToNodes = new Map<number, Node[]>();
    layerToNodes.set(0, Array.from(leafNodes.values()));
    
    console.log(`Created ${leafNodes.size} Leaf Embeddings`);
    console.log('Building All Nodes');
    
    const allNodes = new Map(leafNodes);
    const rootNodes = await this.constructTree(allNodes, allNodes, layerToNodes);
    
    return new Tree(allNodes, rootNodes, leafNodes, this.numLayers, layerToNodes);
  }

  abstract constructTree(
    currentLevelNodes: Map<number, Node>,
    allTreeNodes: Map<number, Node>,
    layerToNodes: Map<number, Node[]>
  ): Promise<Map<number, Node>>;
}