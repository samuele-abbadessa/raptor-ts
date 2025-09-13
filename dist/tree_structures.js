"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tree = exports.Node = void 0;
class Node {
    constructor(text, index, children, embeddings) {
        this.text = text;
        this.index = index;
        this.children = children;
        this.embeddings = embeddings;
    }
}
exports.Node = Node;
class Tree {
    constructor(allNodes, rootNodes, leafNodes, numLayers, layerToNodes) {
        this.allNodes = allNodes;
        this.rootNodes = rootNodes;
        this.leafNodes = leafNodes;
        this.numLayers = numLayers;
        this.layerToNodes = layerToNodes;
    }
}
exports.Tree = Tree;
//# sourceMappingURL=tree_structures.js.map