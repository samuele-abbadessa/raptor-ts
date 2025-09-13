import { TreeBuilder, TreeBuilderConfig } from './tree_builder';
import { Node } from './tree_structures';
import { ClusteringAlgorithm } from './clustering';
export declare class ClusterTreeConfig extends TreeBuilderConfig {
    reductionDimension: number;
    clusteringAlgorithm: ClusteringAlgorithm;
    clusteringParams: any;
    constructor(params?: Partial<ClusterTreeConfig>);
}
export declare class ClusterTreeBuilder extends TreeBuilder {
    private reductionDimension;
    private clusteringAlgorithm;
    private clusteringParams;
    constructor(config: ClusterTreeConfig);
    constructTree(currentLevelNodes: Map<number, Node>, allTreeNodes: Map<number, Node>, layerToNodes: Map<number, Node[]>): Promise<Map<number, Node>>;
}
//# sourceMappingURL=cluster_tree_builder.d.ts.map