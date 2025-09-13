"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RAPTORClustering = void 0;
exports.globalClusterEmbeddings = globalClusterEmbeddings;
exports.getOptimalClusters = getOptimalClusters;
// src/clustering.ts
const umap_js_1 = require("umap-js");
const gaussian_mixture_1 = require("gaussian-mixture");
const tiktoken_1 = require("tiktoken");
function globalClusterEmbeddings(embeddings, dim, nNeighbors, metric = 'cosine') {
    if (!nNeighbors) {
        nNeighbors = Math.floor(Math.sqrt(embeddings.length - 1));
    }
    // UMAP-js doesn't support metric parameter directly in constructor
    // We use the default euclidean metric or implement custom distance function
    const umap = new umap_js_1.UMAP({
        nNeighbors,
        nComponents: dim,
        // If you need cosine similarity, you might need to normalize the embeddings first
        // or use a different UMAP library that supports custom metrics
    });
    return umap.fit(embeddings);
}
function getOptimalClusters(embeddings, maxClusters = 50, randomState = 224) {
    maxClusters = Math.min(maxClusters, embeddings.length);
    const nClusters = Array.from({ length: maxClusters - 1 }, (_, i) => i + 1);
    const bics = nClusters.map(n => {
        const gm = new gaussian_mixture_1.GaussianMixture(n, { seed: randomState });
        gm.fit(embeddings);
        return gm.bic(embeddings);
    });
    const minBic = Math.min(...bics);
    const optimalIndex = bics.indexOf(minBic);
    return nClusters[optimalIndex];
}
class RAPTORClustering {
    async performClustering(nodes, embeddingModelName, maxLengthInCluster = 3500, tokenizer = (0, tiktoken_1.encoding_for_model)('gpt-3.5-turbo'), reductionDimension = 10, threshold = 0.1, verbose = false) {
        const embeddings = nodes.map(node => {
            const embedding = node.embeddings[embeddingModelName];
            if (!embedding) {
                throw new Error(`Embedding for model ${embeddingModelName} not found in node ${node.index}`);
            }
            return embedding;
        });
        // Perform clustering
        const reducedEmbeddings = globalClusterEmbeddings(embeddings, Math.min(reductionDimension, embeddings.length - 2));
        const nClusters = getOptimalClusters(reducedEmbeddings);
        const gm = new gaussian_mixture_1.GaussianMixture(nClusters);
        gm.fit(reducedEmbeddings);
        const probs = gm.predict_proba(reducedEmbeddings);
        const labels = probs.map((prob) => prob.map((p, i) => p > threshold ? i : -1)
            .filter((i) => i >= 0));
        const nodeClusters = [];
        const uniqueLabels = new Set(labels.flat());
        for (const label of uniqueLabels) {
            if (label === -1)
                continue;
            const indices = labels
                .map((labelSet, i) => labelSet.includes(label) ? i : -1)
                .filter((i) => i >= 0);
            const clusterNodes = indices.map((i) => nodes[i]);
            if (clusterNodes.length === 1) {
                nodeClusters.push(clusterNodes);
                continue;
            }
            const totalLength = clusterNodes.reduce((sum, node) => sum + tokenizer.encode(node.text).length, 0);
            if (totalLength > maxLengthInCluster) {
                if (verbose) {
                    console.log(`Reclustering cluster with ${clusterNodes.length} nodes`);
                }
                const subClusters = await this.performClustering(clusterNodes, embeddingModelName, maxLengthInCluster, tokenizer, reductionDimension, threshold, verbose);
                nodeClusters.push(...subClusters);
            }
            else {
                nodeClusters.push(clusterNodes);
            }
        }
        return nodeClusters;
    }
}
exports.RAPTORClustering = RAPTORClustering;
//# sourceMappingURL=clustering.js.map