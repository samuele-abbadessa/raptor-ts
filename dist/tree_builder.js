"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreeBuilder = exports.TreeBuilderConfig = void 0;
const tiktoken_1 = require("tiktoken");
const tree_structures_1 = require("./tree_structures");
const models_1 = require("./models");
const utils_1 = require("./utils");
class TreeBuilderConfig {
    constructor(params = {}) {
        this.tokenizer = params.tokenizer || (0, tiktoken_1.encoding_for_model)('gpt-3.5-turbo');
        this.maxTokens = params.maxTokens || 100;
        this.numLayers = params.numLayers || 5;
        this.threshold = params.threshold || 0.5;
        this.topK = params.topK || 5;
        this.selectionMode = params.selectionMode || 'top_k';
        this.summarizationLength = params.summarizationLength || 100;
        this.summarizationModel = params.summarizationModel || new models_1.GPT3TurboSummarizationModel();
        this.embeddingModels = params.embeddingModels || new Map([['OpenAI', new models_1.OpenAIEmbeddingModel()]]);
        this.clusterEmbeddingModel = params.clusterEmbeddingModel || 'OpenAI';
    }
}
exports.TreeBuilderConfig = TreeBuilderConfig;
class TreeBuilder {
    constructor(config) {
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
    async createNode(index, text, childrenIndices) {
        const children = childrenIndices || new Set();
        const embeddings = {};
        for (const [modelName, model] of this.embeddingModels.entries()) {
            embeddings[modelName] = await model.createEmbedding(text);
        }
        return [index, new tree_structures_1.Node(text, index, children, embeddings)];
    }
    async summarize(context, maxTokens = 150) {
        return this.summarizationModel.summarize(context, maxTokens);
    }
    async buildFromText(text) {
        const chunks = (0, utils_1.splitText)(text, this.tokenizer, this.maxTokens);
        console.log('Creating Leaf Nodes');
        const leafNodes = new Map();
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            if (chunk) { // Ensure chunk is defined
                const [index, node] = await this.createNode(i, chunk);
                leafNodes.set(index, node);
            }
        }
        const layerToNodes = new Map();
        layerToNodes.set(0, Array.from(leafNodes.values()));
        console.log(`Created ${leafNodes.size} Leaf Embeddings`);
        console.log('Building All Nodes');
        const allNodes = new Map(leafNodes);
        const rootNodes = await this.constructTree(allNodes, allNodes, layerToNodes);
        return new tree_structures_1.Tree(allNodes, rootNodes, leafNodes, this.numLayers, layerToNodes);
    }
}
exports.TreeBuilder = TreeBuilder;
//# sourceMappingURL=tree_builder.js.map