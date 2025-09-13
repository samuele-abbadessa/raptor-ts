export interface Embeddings {
  [modelName: string]: number[];
}

// Serializable versions of our classes
export interface SerializedNode {
  text: string;
  index: number;
  children: number[];
  embeddings: Embeddings;
}

export interface SerializedTree {
  allNodes: Array<[number, SerializedNode]>;
  rootNodes: Array<[number, SerializedNode]>;
  leafNodes: Array<[number, SerializedNode]>;
  numLayers: number;
  layerToNodes: Array<[number, SerializedNode[]]>;
}

export class Node {
  constructor(
    public text: string,
    public index: number,
    public children: Set<number>,
    public embeddings: Embeddings
  ) {}

  // Convert Node to a serializable format
  toJSON(): SerializedNode {
    return {
      text: this.text,
      index: this.index,
      children: Array.from(this.children),
      embeddings: this.embeddings
    };
  }

  // Create Node from serialized format
  static fromJSON(data: SerializedNode): Node {
    return new Node(
      data.text,
      data.index,
      new Set(data.children),
      data.embeddings
    );
  }
}

export class Tree {
  constructor(
    public allNodes: Map<number, Node>,
    public rootNodes: Map<number, Node> | Node[],
    public leafNodes: Map<number, Node>,
    public numLayers: number,
    public layerToNodes: Map<number, Node[]>
  ) {}

  // Convert Tree to a serializable format
  toJSON(): SerializedTree {
    const serializeNodeMap = (map: Map<number, Node>): Array<[number, SerializedNode]> => {
      return Array.from(map.entries()).map(([key, node]) => [key, node.toJSON()]);
    };

    const serializeLayerToNodes = (map: Map<number, Node[]>): Array<[number, SerializedNode[]]> => {
      return Array.from(map.entries()).map(([layer, nodes]) => [
        layer,
        nodes.map(node => node.toJSON())
      ]);
    };

    // Handle rootNodes which can be either a Map or an Array
    let serializedRootNodes: Array<[number, SerializedNode]>;
    if (Array.isArray(this.rootNodes)) {
      // If it's an array, create entries with indices as keys
      serializedRootNodes = this.rootNodes.map((node, index) => [node.index, node.toJSON()]);
    } else {
      serializedRootNodes = serializeNodeMap(this.rootNodes);
    }

    return {
      allNodes: serializeNodeMap(this.allNodes),
      rootNodes: serializedRootNodes,
      leafNodes: serializeNodeMap(this.leafNodes),
      numLayers: this.numLayers,
      layerToNodes: serializeLayerToNodes(this.layerToNodes)
    };
  }

  // Create Tree from serialized format
  static fromJSON(data: SerializedTree): Tree {
    const deserializeNodeMap = (entries: Array<[number, SerializedNode]>): Map<number, Node> => {
      const map = new Map<number, Node>();
      entries.forEach(([key, nodeData]) => {
        map.set(key, Node.fromJSON(nodeData));
      });
      return map;
    };

    const deserializeLayerToNodes = (entries: Array<[number, SerializedNode[]]>): Map<number, Node[]> => {
      const map = new Map<number, Node[]>();
      entries.forEach(([layer, nodesData]) => {
        map.set(layer, nodesData.map(nodeData => Node.fromJSON(nodeData)));
      });
      return map;
    };

    return new Tree(
      deserializeNodeMap(data.allNodes),
      deserializeNodeMap(data.rootNodes),
      deserializeNodeMap(data.leafNodes),
      data.numLayers,
      deserializeLayerToNodes(data.layerToNodes)
    );
  }
}