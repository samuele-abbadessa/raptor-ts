// src/tree_structures.ts

import { DocumentReference } from './document/types';
import { DocumentStorage } from './document/storage';

export interface Embeddings {
  [modelName: string]: number[];
}

// Serializable versions of our classes
export interface SerializedNode {
  text: string;
  index: number;
  children: number[];
  embeddings: Embeddings;
  documentRef?: DocumentReference;
  chunkMetadata?: Array<[string, any]>;
}

export interface SerializedTree {
  allNodes: Array<[number, SerializedNode]>;
  rootNodes: Array<[number, SerializedNode]>;
  leafNodes: Array<[number, SerializedNode]>;
  numLayers: number;
  layerToNodes: Array<[number, SerializedNode[]]>;
}

export class Node {
  public documentRef?: DocumentReference;
  public chunkMetadata?: Map<string, any>;

  constructor(
    public text: string,
    public index: number,
    public children: Set<number>,
    public embeddings: Embeddings,
    documentRef?: DocumentReference,
    chunkMetadata?: Map<string, any>
  ) {
    this.documentRef = documentRef;
    this.chunkMetadata = chunkMetadata;
  }

  // Convert Node to a serializable format
  toJSON(): SerializedNode {
    return {
      text: this.text,
      index: this.index,
      children: Array.from(this.children),
      embeddings: this.embeddings,
      documentRef: this.documentRef,
      chunkMetadata: this.chunkMetadata ? 
        Array.from(this.chunkMetadata.entries()) : undefined
    };
  }

  // Create Node from serialized format
  static fromJSON(data: SerializedNode): Node {
    return new Node(
      data.text,
      data.index,
      new Set(data.children),
      data.embeddings,
      data.documentRef,
      data.chunkMetadata ? new Map(data.chunkMetadata) : undefined
    );
  }
}

// Document-aware node that can lazy-load text from storage
export class DocumentReferenceNode extends Node {
  private _text?: string;
  private documentStorage?: DocumentStorage;
  public summarizedText?: string;
  public sourceNodes?: Set<number>;

  constructor(
    documentRef: DocumentReference,
    index: number,
    children: Set<number>,
    embeddings: Embeddings,
    chunkMetadata?: Map<string, any>,
    summarizedText?: string,
    sourceNodes?: Set<number>
  ) {
    super('', index, children, embeddings, documentRef, chunkMetadata);
    this.summarizedText = summarizedText;
    this.sourceNodes = sourceNodes;
  }

  async getText(storage: DocumentStorage): Promise<string> {
    if (this._text) return this._text;
    
    if (this.summarizedText) {
      this._text = this.summarizedText;
      return this._text;
    }
    
    if (!this.documentRef) {
      throw new Error('No document reference or summarized text available');
    }
    
    const doc = await storage.get(this.documentRef.documentId);
    if (!doc) throw new Error(`Document ${this.documentRef.documentId} not found`);
    
    this._text = doc.content.substring(
      this.documentRef.charStart,
      this.documentRef.charEnd
    );
    return this._text;
  }

  toJSON(): SerializedNode {
    const base = super.toJSON();
    return {
      ...base,
      text: this.summarizedText || '',  // Store summary if available
      documentRef: this.documentRef,
      chunkMetadata: this.chunkMetadata ? 
        Array.from(this.chunkMetadata.entries()) : undefined
    };
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