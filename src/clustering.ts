// src/clustering.ts
import { UMAP } from 'umap-js';
import { encoding_for_model } from 'tiktoken';
import { Node } from './tree_structures';
import { GaussianMixture } from './gmm';

export interface ClusteringAlgorithm {
  performClustering(
    nodes: Node[],
    embeddingModelName: string,
    maxLengthInCluster?: number,
    tokenizer?: any,
    reductionDimension?: number,
    threshold?: number,
    verbose?: boolean
  ): Promise<Node[][]>;
}

/**
 * Normalize embeddings to unit vectors, making Euclidean distance equivalent to cosine distance
 * This is a common preprocessing step for high-dimensional embeddings
 */
export function normalizeEmbeddings(embeddings: number[][]): number[][] {
  return embeddings.map(embedding => {
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (norm === 0) {
      console.warn('Zero-norm embedding detected, returning original vector');
      return embedding;
    }
    return embedding.map(val => val / norm);
  });
}

/**
 * Compute cosine distance matrix for precomputed UMAP usage
 */
export function computeCosineDistanceMatrix(embeddings: number[][]): number[][] {
  const n = embeddings.length;
  const distanceMatrix = Array(n).fill(null).map(() => Array(n).fill(0));
  
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      if (i === j) {
        distanceMatrix[i][j] = 0;
      } else {
        const distance = cosineDistance(embeddings[i], embeddings[j]);
        distanceMatrix[i][j] = distance;
        distanceMatrix[j][i] = distance; // Symmetric matrix
      }
    }
  }
  
  return distanceMatrix;
}

/**
 * Calculate cosine distance between two vectors
 */
function cosineDistance(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  
  if (normA === 0 || normB === 0) {
    return 1; // Maximum distance for zero vectors
  }
  
  return 1 - dotProduct / (normA * normB);
}

export function globalClusterEmbeddings(
  embeddings: number[][],
  dim: number,
  nNeighbors?: number
): number[][] {
  if (!nNeighbors) {
    nNeighbors = Math.floor(Math.sqrt(embeddings.length - 1));
  }
  
  // Normalize embeddings (fast and nearly equivalent)
  console.log('Normalizing embeddings to unit vectors for cosine-like distance');
  const normalizedEmbeddings = normalizeEmbeddings(embeddings);
  
  const umap = new UMAP({
    nNeighbors,
    nComponents: dim,
    // With normalized vectors, Euclidean distance ≈ cosine distance
    // ||a||=||b||=1 → ||a-b||² = 2(1 - a·b) = 2 * cosine_distance
  });
  
  return umap.fit(normalizedEmbeddings);
}

export function getOptimalClusters(
  embeddings: number[][],
  maxClusters: number = 50,
  randomState: number = 224
): number {
  maxClusters = Math.min(maxClusters, embeddings.length);
  const nClusters = Array.from({ length: maxClusters - 1 }, (_, i) => i + 1);
  
  // Normalize embeddings if using cosine-based clustering
  const processedEmbeddings = normalizeEmbeddings(embeddings);
  
  const bics = nClusters.map(n => {
    const gm = new GaussianMixture(n, { seed: randomState });
    gm.fit(processedEmbeddings);
    return gm.bic(processedEmbeddings);
  });
  
  const minBic = Math.min(...bics);
  const optimalIndex = bics.indexOf(minBic);
  return nClusters[optimalIndex];
}

export class RAPTORClustering implements ClusteringAlgorithm {
  async performClustering(
    nodes: Node[],
    embeddingModelName: string,
    maxLengthInCluster: number = 3500,
    tokenizer: any = encoding_for_model('gpt-3.5-turbo'),
    reductionDimension: number = 10,
    threshold: number = 0.1,
    verbose: boolean = false
  ): Promise<Node[][]> {
    const embeddings = nodes.map(node => {
      const embedding = node.embeddings[embeddingModelName];
      if (!embedding) {
        throw new Error(`Embedding for model ${embeddingModelName} not found in node ${node.index}`);
      }
      return embedding;
    });
    
    // Perform dimensionality reduction
    const reducedEmbeddings = globalClusterEmbeddings(
      embeddings,
      Math.min(reductionDimension, embeddings.length - 2),
      undefined,
    );
    
    // Use normalized embeddings for clustering if using cosine
    const clusteringEmbeddings = normalizeEmbeddings(reducedEmbeddings);
    
    const nClusters = getOptimalClusters(clusteringEmbeddings, 50, 224); // Already normalized
    const gm = new GaussianMixture(nClusters);
    gm.fit(clusteringEmbeddings);
    
    const probs = gm.predict_proba(clusteringEmbeddings);
    const labels = probs.map((prob: number[]) => 
      prob.map((p: number, i: number) => p > threshold ? i : -1)
        .filter((i: number) => i >= 0)
    );
    
    const nodeClusters: Node[][] = [];
    const uniqueLabels = new Set(labels.flat());
    
    for (const label of uniqueLabels) {
      if (label === -1) continue;
      
      const indices = labels
        .map((labelSet: number[], i: number) => labelSet.includes(label) ? i : -1)
        .filter((i: number) => i >= 0);
      
      const clusterNodes = indices.map((i: number) => nodes[i]);
      
      if (clusterNodes.length === 1) {
        nodeClusters.push(clusterNodes);
        continue;
      }
      
      const totalLength = clusterNodes.reduce(
        (sum: number, node: Node) => sum + tokenizer.encode(node.text).length,
        0
      );
      
      if (totalLength > maxLengthInCluster) {
        if (verbose) {
          console.log(`Reclustering cluster with ${clusterNodes.length} nodes`);
        }
        const subClusters = await this.performClustering(
          clusterNodes,
          embeddingModelName,
          maxLengthInCluster,
          tokenizer,
          reductionDimension,
          threshold,
          verbose
        );
        nodeClusters.push(...subClusters);
      } else {
        nodeClusters.push(clusterNodes);
      }
    }
    
    return nodeClusters;
  }
}