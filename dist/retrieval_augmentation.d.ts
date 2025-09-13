import { Tree } from './tree_structures';
import { TreeBuilderConfig } from './tree_builder';
import { ClusterTreeConfig } from './cluster_tree_builder';
import { TreeRetrieverConfig } from './tree_retriever';
import { BaseQAModel } from './models';
export declare class RetrievalAugmentationConfig {
    treeBuilderConfig: TreeBuilderConfig | ClusterTreeConfig;
    treeRetrieverConfig: TreeRetrieverConfig;
    qaModel: BaseQAModel;
    treeBuilderType: string;
    constructor(params?: Partial<RetrievalAugmentationConfig>);
}
export declare class RetrievalAugmentation {
    private tree;
    private treeBuilder;
    private treeRetrieverConfig;
    private qaModel;
    private retriever;
    constructor(config?: RetrievalAugmentationConfig, tree?: Tree | string);
    addDocuments(docs: string): Promise<void>;
    retrieve(question: string, startLayer?: number, numLayers?: number, topK?: number, maxTokens?: number, collapseTree?: boolean, returnLayerInformation?: boolean): Promise<string | [string, any[]]>;
    answerQuestion(question: string, topK?: number, startLayer?: number, numLayers?: number, maxTokens?: number, collapseTree?: boolean, returnLayerInformation?: boolean): Promise<string | [string, any]>;
    save(path: string): void;
}
//# sourceMappingURL=retrieval_augmentation.d.ts.map