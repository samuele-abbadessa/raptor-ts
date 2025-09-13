import { Node, Tree } from './tree_structures';
import { BaseEmbeddingModel } from './models';
export declare class TreeRetrieverConfig {
    tokenizer: any;
    threshold: number;
    topK: number;
    selectionMode: 'top_k' | 'threshold';
    contextEmbeddingModel: string;
    embeddingModel: BaseEmbeddingModel;
    numLayers: number | undefined;
    startLayer: number | undefined;
    constructor(params?: Partial<TreeRetrieverConfig>);
}
export declare class TreeRetriever {
    private tree;
    private numLayers;
    private startLayer;
    private tokenizer;
    private topK;
    private threshold;
    private selectionMode;
    private embeddingModel;
    private contextEmbeddingModel;
    private treeNodeIndexToLayer;
    constructor(config: TreeRetrieverConfig, tree: Tree);
    createEmbedding(text: string): Promise<number[]>;
    retrieveInformationCollapseTree(query: string, topK: number, maxTokens: number): Promise<[Node[], string]>;
    retrieve(query: string): Promise<string>;
    retrieve(query: string, startLayer?: number, numLayers?: number, topK?: number, maxTokens?: number, collapseTree?: boolean, returnLayerInformation?: false): Promise<string>;
    retrieve(query: string, startLayer?: number, numLayers?: number, topK?: number, maxTokens?: number, collapseTree?: boolean, returnLayerInformation?: true): Promise<[string, any[]]>;
    private retrieveInformation;
}
//# sourceMappingURL=tree_retriever.d.ts.map