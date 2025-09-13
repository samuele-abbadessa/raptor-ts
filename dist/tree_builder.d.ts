import { Node, Tree } from './tree_structures';
import { BaseEmbeddingModel, BaseSummarizationModel } from './models';
export declare class TreeBuilderConfig {
    tokenizer: any;
    maxTokens: number;
    numLayers: number;
    threshold: number;
    topK: number;
    selectionMode: 'top_k' | 'threshold';
    summarizationLength: number;
    summarizationModel: BaseSummarizationModel;
    embeddingModels: Map<string, BaseEmbeddingModel>;
    clusterEmbeddingModel: string;
    constructor(params?: Partial<TreeBuilderConfig>);
}
export declare abstract class TreeBuilder {
    protected tokenizer: any;
    protected maxTokens: number;
    protected numLayers: number;
    protected topK: number;
    protected threshold: number;
    protected selectionMode: 'top_k' | 'threshold';
    protected summarizationLength: number;
    protected summarizationModel: BaseSummarizationModel;
    protected embeddingModels: Map<string, BaseEmbeddingModel>;
    protected clusterEmbeddingModel: string;
    constructor(config: TreeBuilderConfig);
    createNode(index: number, text: string, childrenIndices?: Set<number>): Promise<[number, Node]>;
    summarize(context: string, maxTokens?: number): Promise<string>;
    buildFromText(text: string): Promise<Tree>;
    abstract constructTree(currentLevelNodes: Map<number, Node>, allTreeNodes: Map<number, Node>, layerToNodes: Map<number, Node[]>): Promise<Map<number, Node>>;
}
//# sourceMappingURL=tree_builder.d.ts.map