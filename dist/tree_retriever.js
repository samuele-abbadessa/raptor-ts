"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreeRetriever = exports.TreeRetrieverConfig = void 0;
const tiktoken_1 = require("tiktoken");
const models_1 = require("./models");
const utils_1 = require("./utils");
class TreeRetrieverConfig {
    constructor(params = {}) {
        this.tokenizer = params.tokenizer || (0, tiktoken_1.encoding_for_model)('gpt-3.5-turbo');
        this.threshold = params.threshold || 0.5;
        this.topK = params.topK || 5;
        this.selectionMode = params.selectionMode || 'top_k';
        this.contextEmbeddingModel = params.contextEmbeddingModel || 'OpenAI';
        this.embeddingModel = params.embeddingModel || new models_1.OpenAIEmbeddingModel();
        this.numLayers = params.numLayers;
        this.startLayer = params.startLayer;
    }
}
exports.TreeRetrieverConfig = TreeRetrieverConfig;
class TreeRetriever {
    constructor(config, tree) {
        this.tree = tree;
        this.numLayers = config.numLayers !== undefined ? config.numLayers : tree.numLayers + 1;
        this.startLayer = config.startLayer !== undefined ? config.startLayer : tree.numLayers;
        this.tokenizer = config.tokenizer;
        this.topK = config.topK;
        this.threshold = config.threshold;
        this.selectionMode = config.selectionMode;
        this.embeddingModel = config.embeddingModel;
        this.contextEmbeddingModel = config.contextEmbeddingModel;
        this.treeNodeIndexToLayer = (0, utils_1.reverseMapping)(tree.layerToNodes);
    }
    async createEmbedding(text) {
        return this.embeddingModel.createEmbedding(text);
    }
    async retrieveInformationCollapseTree(query, topK, maxTokens) {
        const queryEmbedding = await this.createEmbedding(query);
        const selectedNodes = [];
        const nodeList = (0, utils_1.getNodeList)(this.tree.allNodes);
        const embeddings = (0, utils_1.getEmbeddings)(nodeList, this.contextEmbeddingModel);
        const distances = (0, utils_1.distancesFromEmbeddings)(queryEmbedding, embeddings);
        const indices = (0, utils_1.indicesOfNearestNeighborsFromDistances)(distances);
        let totalTokens = 0;
        for (const idx of indices.slice(0, topK)) {
            const node = nodeList[idx];
            if (!node)
                continue; // Skip if node is undefined
            const nodeTokens = this.tokenizer.encode(node.text).length;
            if (totalTokens + nodeTokens > maxTokens)
                break;
            selectedNodes.push(node);
            totalTokens += nodeTokens;
        }
        const context = (0, utils_1.getText)(selectedNodes);
        return [selectedNodes, context];
    }
    async retrieve(query, startLayer, numLayers, topK = 10, maxTokens = 3500, collapseTree = true, returnLayerInformation = false) {
        startLayer = startLayer ?? this.startLayer;
        numLayers = numLayers ?? this.numLayers;
        let selectedNodes;
        let context;
        if (collapseTree) {
            console.log('Using collapsed_tree');
            [selectedNodes, context] = await this.retrieveInformationCollapseTree(query, topK, maxTokens);
        }
        else {
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
    async retrieveInformation(currentNodes, query, numLayers) {
        const queryEmbedding = await this.createEmbedding(query);
        const selectedNodes = [];
        let nodeList = currentNodes;
        for (let layer = 0; layer < numLayers; layer++) {
            const embeddings = (0, utils_1.getEmbeddings)(nodeList, this.contextEmbeddingModel);
            const distances = (0, utils_1.distancesFromEmbeddings)(queryEmbedding, embeddings);
            const indices = (0, utils_1.indicesOfNearestNeighborsFromDistances)(distances);
            let bestIndices;
            if (this.selectionMode === 'threshold') {
                bestIndices = indices.filter(index => distances[index] > this.threshold);
            }
            else {
                bestIndices = indices.slice(0, this.topK);
            }
            const nodesToAdd = bestIndices.map(idx => nodeList[idx]).filter(node => node !== undefined);
            selectedNodes.push(...nodesToAdd);
            if (layer !== numLayers - 1) {
                const childNodes = new Set();
                for (const idx of bestIndices) {
                    const node = nodeList[idx];
                    if (node) {
                        node.children.forEach(child => childNodes.add(child));
                    }
                }
                nodeList = Array.from(childNodes)
                    .map(i => this.tree.allNodes.get(i))
                    .filter(node => node !== undefined);
            }
        }
        const context = (0, utils_1.getText)(selectedNodes);
        return [selectedNodes, context];
    }
}
exports.TreeRetriever = TreeRetriever;
//# sourceMappingURL=tree_retriever.js.map