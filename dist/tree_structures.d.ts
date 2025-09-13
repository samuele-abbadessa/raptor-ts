export interface Embeddings {
    [modelName: string]: number[];
}
export declare class Node {
    text: string;
    index: number;
    children: Set<number>;
    embeddings: Embeddings;
    constructor(text: string, index: number, children: Set<number>, embeddings: Embeddings);
}
export declare class Tree {
    allNodes: Map<number, Node>;
    rootNodes: Map<number, Node> | Node[];
    leafNodes: Map<number, Node>;
    numLayers: number;
    layerToNodes: Map<number, Node[]>;
    constructor(allNodes: Map<number, Node>, rootNodes: Map<number, Node> | Node[], leafNodes: Map<number, Node>, numLayers: number, layerToNodes: Map<number, Node[]>);
}
//# sourceMappingURL=tree_structures.d.ts.map