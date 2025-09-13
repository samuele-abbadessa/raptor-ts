"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetrievalAugmentation = exports.RetrievalAugmentationConfig = void 0;
const tree_builder_1 = require("./tree_builder");
const cluster_tree_builder_1 = require("./cluster_tree_builder");
const tree_retriever_1 = require("./tree_retriever");
const models_1 = require("./models");
class RetrievalAugmentationConfig {
    constructor(params = {}) {
        this.treeBuilderType = params.treeBuilderType || 'cluster';
        this.treeBuilderConfig = params.treeBuilderConfig ||
            (this.treeBuilderType === 'cluster' ? new cluster_tree_builder_1.ClusterTreeConfig() : new tree_builder_1.TreeBuilderConfig());
        this.treeRetrieverConfig = params.treeRetrieverConfig || new tree_retriever_1.TreeRetrieverConfig();
        this.qaModel = params.qaModel || new models_1.GPT3TurboQAModel();
    }
}
exports.RetrievalAugmentationConfig = RetrievalAugmentationConfig;
class RetrievalAugmentation {
    constructor(config, tree) {
        config = config || new RetrievalAugmentationConfig();
        if (typeof tree === 'string') {
            // Load from file - in TypeScript you'd use fs.readFileSync and JSON.parse
            // This is a simplified version
            throw new Error('Loading from file not implemented in this example');
        }
        else {
            this.tree = tree;
        }
        // Use the appropriate builder based on type
        if (config.treeBuilderType === 'cluster') {
            this.treeBuilder = new cluster_tree_builder_1.ClusterTreeBuilder(config.treeBuilderConfig);
        }
        else {
            // For non-cluster types, you'd need to implement a concrete TreeBuilder
            // Since TreeBuilder is abstract, we'll use ClusterTreeBuilder as default
            this.treeBuilder = new cluster_tree_builder_1.ClusterTreeBuilder(config.treeBuilderConfig instanceof cluster_tree_builder_1.ClusterTreeConfig
                ? config.treeBuilderConfig
                : new cluster_tree_builder_1.ClusterTreeConfig(config.treeBuilderConfig));
        }
        this.treeRetrieverConfig = config.treeRetrieverConfig;
        this.qaModel = config.qaModel;
        if (this.tree) {
            this.retriever = new tree_retriever_1.TreeRetriever(this.treeRetrieverConfig, this.tree);
        }
    }
    async addDocuments(docs) {
        if (this.tree) {
            // In a browser environment, you might use confirm()
            // In Node.js, you'd use a different approach
            console.warn('Warning: Overwriting existing tree.');
            // const userConfirm = confirm('Warning: Overwriting existing tree. Continue?');
            // if (!userConfirm) return;
        }
        this.tree = await this.treeBuilder.buildFromText(docs);
        this.retriever = new tree_retriever_1.TreeRetriever(this.treeRetrieverConfig, this.tree);
    }
    async retrieve(question, startLayer, numLayers, topK = 10, maxTokens = 3500, collapseTree = true, returnLayerInformation = true) {
        if (!this.retriever) {
            throw new Error("The TreeRetriever instance has not been initialized. Call 'addDocuments' first.");
        }
        return this.retriever.retrieve(question, startLayer, numLayers, topK, maxTokens, collapseTree, returnLayerInformation);
    }
    async answerQuestion(question, topK = 10, startLayer, numLayers, maxTokens = 3500, collapseTree = true, returnLayerInformation = false) {
        const result = await this.retrieve(question, startLayer, numLayers, topK, maxTokens, collapseTree, true);
        const [context, layerInformation] = Array.isArray(result) ? result : [result, null];
        const answer = await this.qaModel.answerQuestion(context, question);
        if (returnLayerInformation) {
            return [answer, layerInformation];
        }
        return answer;
    }
    save(path) {
        if (!this.tree) {
            throw new Error('There is no tree to save.');
        }
        // In a real implementation, you'd use fs.writeFileSync here
        // fs.writeFileSync(path, JSON.stringify(this.tree));
        console.log(`Tree would be saved to ${path}`);
    }
}
exports.RetrievalAugmentation = RetrievalAugmentation;
//# sourceMappingURL=retrieval_augmentation.js.map