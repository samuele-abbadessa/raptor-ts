import { Tree } from './tree_structures';
import { TreeBuilder, TreeBuilderConfig } from './tree_builder';
import { ClusterTreeBuilder, ClusterTreeConfig } from './cluster_tree_builder';
import { TreeRetriever, TreeRetrieverConfig } from './tree_retriever';
import { BaseQAModel, GPT3TurboQAModel } from './models';

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

  constructor(config?: RetrievalAugmentationConfig, tree?: Tree | string) {
    config = config || new RetrievalAugmentationConfig();
    
    if (typeof tree === 'string') {
      // Load from file - in TypeScript you'd use fs.readFileSync and JSON.parse
      // This is a simplified version
      throw new Error('Loading from file not implemented in this example');
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
    
    if (this.tree) {
      this.retriever = new TreeRetriever(this.treeRetrieverConfig, this.tree);
    }
  }

  async addDocuments(docs: string): Promise<void> {
    if (this.tree) {
      // In a browser environment, you might use confirm()
      // In Node.js, you'd use a different approach
      console.warn('Warning: Overwriting existing tree.');
      // const userConfirm = confirm('Warning: Overwriting existing tree. Continue?');
      // if (!userConfirm) return;
    }
    
    this.tree = await this.treeBuilder.buildFromText(docs);
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

  save(path: string): void {
    if (!this.tree) {
      throw new Error('There is no tree to save.');
    }
    // In a real implementation, you'd use fs.writeFileSync here
    // fs.writeFileSync(path, JSON.stringify(this.tree));
    console.log(`Tree would be saved to ${path}`);
  }
}