import { TreeBuilder, TreeBuilderConfig } from './tree_builder';
import { Node, Tree } from './tree_structures';
import { ClusteringAlgorithm, RAPTORClustering } from './clustering';
import { getNodeList, getText } from './utils';

export class ClusterTreeConfig extends TreeBuilderConfig {
  reductionDimension: number;
  clusteringAlgorithm: ClusteringAlgorithm;
  clusteringParams: any;

  constructor(params: Partial<ClusterTreeConfig> = {}) {
    super(params);
    this.reductionDimension = params.reductionDimension || 10;
    this.clusteringAlgorithm = params.clusteringAlgorithm || new RAPTORClustering();
    this.clusteringParams = params.clusteringParams || {};
  }
}

export class ClusterTreeBuilder extends TreeBuilder {
  private reductionDimension: number;
  private clusteringAlgorithm: ClusteringAlgorithm;
  private clusteringParams: any;

  constructor(config: ClusterTreeConfig) {
    super(config);
    this.reductionDimension = config.reductionDimension;
    this.clusteringAlgorithm = config.clusteringAlgorithm;
    this.clusteringParams = config.clusteringParams;
  }

  async constructTree(
    currentLevelNodes: Map<number, Node>,
    allTreeNodes: Map<number, Node>,
    layerToNodes: Map<number, Node[]>
  ): Promise<Map<number, Node>> {
    console.log('Using Cluster TreeBuilder');
    let nextNodeIndex = allTreeNodes.size;

    for (let layer = 0; layer < this.numLayers; layer++) {
      const newLevelNodes = new Map<number, Node>();
      console.log(`Constructing Layer ${layer}`);
      
      const nodeListCurrentLayer = getNodeList(currentLevelNodes);
      
      if (nodeListCurrentLayer.length <= this.reductionDimension + 1) {
        this.numLayers = layer;
        console.log(`Stopping Layer construction: Cannot Create More Layers. Total Layers in tree: ${layer}`);
        break;
      }
      
      const clusters = await this.clusteringAlgorithm.performClustering(
        nodeListCurrentLayer,
        this.clusterEmbeddingModel,
        undefined,
        this.tokenizer,
        this.reductionDimension,
        this.clusteringParams.threshold,
        this.clusteringParams.verbose
      );
      
      for (const cluster of clusters) {
        const nodeTexts = getText(cluster);
        const summarizedText = await this.summarize(nodeTexts, this.summarizationLength);
        
        console.log(
          `Node Texts Length: ${this.tokenizer.encode(nodeTexts).length}, ` +
          `Summarized Text Length: ${this.tokenizer.encode(summarizedText).length}`
        );
        
        const childrenIndices = new Set(cluster.map(node => node.index));
        const [_, newParentNode] = await this.createNode(
          nextNodeIndex,
          summarizedText,
          childrenIndices
        );
        
        newLevelNodes.set(nextNodeIndex, newParentNode);
        nextNodeIndex++;
      }
      
      layerToNodes.set(layer + 1, Array.from(newLevelNodes.values()));
      currentLevelNodes = newLevelNodes;
      
      for (const [index, node] of newLevelNodes) {
        allTreeNodes.set(index, node);
      }
    }
    
    return currentLevelNodes;
  }
}