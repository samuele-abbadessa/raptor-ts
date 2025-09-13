"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClusterTreeBuilder = exports.ClusterTreeConfig = void 0;
const tree_builder_1 = require("./tree_builder");
const clustering_1 = require("./clustering");
const utils_1 = require("./utils");
class ClusterTreeConfig extends tree_builder_1.TreeBuilderConfig {
    constructor(params = {}) {
        super(params);
        this.reductionDimension = params.reductionDimension || 10;
        this.clusteringAlgorithm = params.clusteringAlgorithm || new clustering_1.RAPTORClustering();
        this.clusteringParams = params.clusteringParams || {};
    }
}
exports.ClusterTreeConfig = ClusterTreeConfig;
class ClusterTreeBuilder extends tree_builder_1.TreeBuilder {
    constructor(config) {
        super(config);
        this.reductionDimension = config.reductionDimension;
        this.clusteringAlgorithm = config.clusteringAlgorithm;
        this.clusteringParams = config.clusteringParams;
    }
    async constructTree(currentLevelNodes, allTreeNodes, layerToNodes) {
        console.log('Using Cluster TreeBuilder');
        let nextNodeIndex = allTreeNodes.size;
        for (let layer = 0; layer < this.numLayers; layer++) {
            const newLevelNodes = new Map();
            console.log(`Constructing Layer ${layer}`);
            const nodeListCurrentLayer = (0, utils_1.getNodeList)(currentLevelNodes);
            if (nodeListCurrentLayer.length <= this.reductionDimension + 1) {
                this.numLayers = layer;
                console.log(`Stopping Layer construction: Cannot Create More Layers. Total Layers in tree: ${layer}`);
                break;
            }
            const clusters = await this.clusteringAlgorithm.performClustering(nodeListCurrentLayer, this.clusterEmbeddingModel, undefined, this.tokenizer, this.reductionDimension, this.clusteringParams.threshold, this.clusteringParams.verbose);
            for (const cluster of clusters) {
                const nodeTexts = (0, utils_1.getText)(cluster);
                const summarizedText = await this.summarize(nodeTexts, this.summarizationLength);
                console.log(`Node Texts Length: ${this.tokenizer.encode(nodeTexts).length}, ` +
                    `Summarized Text Length: ${this.tokenizer.encode(summarizedText).length}`);
                const childrenIndices = new Set(cluster.map(node => node.index));
                const [_, newParentNode] = await this.createNode(nextNodeIndex, summarizedText, childrenIndices);
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
exports.ClusterTreeBuilder = ClusterTreeBuilder;
//# sourceMappingURL=cluster_tree_builder.js.map