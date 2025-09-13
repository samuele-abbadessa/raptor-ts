// src/clustering.ts
import { UMAP } from 'umap-js';
import { GaussianMixture } from 'gaussian-mixture';
import { encoding_for_model } from 'tiktoken';
import { Node } from './tree_structures';

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

export function globalClusterEmbeddings(
  embeddings: number[][],
  dim: number,
  nNeighbors?: number,
  metric: string = 'cosine'
): number[][] {
  if (!nNeighbors) {
    nNeighbors = Math.floor(Math.sqrt(embeddings.length - 1));
  }
  
  // UMAP-js doesn't support metric parameter directly in constructor
  // We use the default euclidean metric or implement custom distance function
  const umap = new UMAP({
    nNeighbors,
    nComponents: dim,
    // If you need cosine similarity, you might need to normalize the embeddings first
    // or use a different UMAP library that supports custom metrics
  });
  
  return umap.fit(embeddings);
}

export function getOptimalClusters(
  embeddings: number[][],
  maxClusters: number = 50,
  randomState: number = 224
): number {
  maxClusters = Math.min(maxClusters, embeddings.length);
  const nClusters = Array.from({ length: maxClusters - 1 }, (_, i) => i + 1);
  
  const bics = nClusters.map(n => {
    const gm = new GaussianMixture(n, { seed: randomState });
    gm.fit(embeddings);
    return gm.bic(embeddings);
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
    
    // Perform clustering
    const reducedEmbeddings = globalClusterEmbeddings(
      embeddings,
      Math.min(reductionDimension, embeddings.length - 2)
    );
    
    const nClusters = getOptimalClusters(reducedEmbeddings);
    const gm = new GaussianMixture(nClusters);
    gm.fit(reducedEmbeddings);
    
    const probs = gm.predict_proba(reducedEmbeddings);
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