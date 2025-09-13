import { Node } from './tree_structures';
export interface ClusteringAlgorithm {
    performClustering(nodes: Node[], embeddingModelName: string, maxLengthInCluster?: number, tokenizer?: any, reductionDimension?: number, threshold?: number, verbose?: boolean): Promise<Node[][]>;
}
export declare function globalClusterEmbeddings(embeddings: number[][], dim: number, nNeighbors?: number, metric?: string): number[][];
export declare function getOptimalClusters(embeddings: number[][], maxClusters?: number, randomState?: number): number;
export declare class RAPTORClustering implements ClusteringAlgorithm {
    performClustering(nodes: Node[], embeddingModelName: string, maxLengthInCluster?: number, tokenizer?: any, reductionDimension?: number, threshold?: number, verbose?: boolean): Promise<Node[][]>;
}
//# sourceMappingURL=clustering.d.ts.map