import { Node } from './tree_structures';
export declare function reverseMapping(layerToNodes: Map<number, Node[]>): Map<number, number>;
export declare function splitText(text: string, tokenizer: any, maxTokens: number, overlap?: number): string[];
export declare function cosineDistance(a: number[], b: number[]): number;
export declare function distancesFromEmbeddings(queryEmbedding: number[], embeddings: number[][], distanceMetric?: string): number[];
export declare function indicesOfNearestNeighborsFromDistances(distances: number[]): number[];
export declare function getNodeList(nodeDict: Map<number, Node>): Node[];
export declare function getEmbeddings(nodeList: Node[], embeddingModel: string): number[][];
export declare function getText(nodeList: Node[]): string;
//# sourceMappingURL=utils.d.ts.map