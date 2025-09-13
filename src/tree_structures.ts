export interface Embeddings {
  [modelName: string]: number[];
}

export class Node {
  constructor(
    public text: string,
    public index: number,
    public children: Set<number>,
    public embeddings: Embeddings
  ) {}
}

export class Tree {
  constructor(
    public allNodes: Map<number, Node>,
    public rootNodes: Map<number, Node> | Node[],
    public leafNodes: Map<number, Node>,
    public numLayers: number,
    public layerToNodes: Map<number, Node[]>
  ) {}
}