"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.reverseMapping = reverseMapping;
exports.splitText = splitText;
exports.cosineDistance = cosineDistance;
exports.distancesFromEmbeddings = distancesFromEmbeddings;
exports.indicesOfNearestNeighborsFromDistances = indicesOfNearestNeighborsFromDistances;
exports.getNodeList = getNodeList;
exports.getEmbeddings = getEmbeddings;
exports.getText = getText;
const _ = __importStar(require("lodash"));
function reverseMapping(layerToNodes) {
    const nodeToLayer = new Map();
    layerToNodes.forEach((nodes, layer) => {
        nodes.forEach(node => {
            nodeToLayer.set(node.index, layer);
        });
    });
    return nodeToLayer;
}
function splitText(text, tokenizer, maxTokens, overlap = 0) {
    const delimiters = ['.', '!', '?', '\n'];
    const regexPattern = new RegExp(delimiters.map(d => _.escapeRegExp(d)).join('|'), 'g');
    const sentences = text.split(regexPattern).filter(s => s.trim());
    const nTokens = sentences.map(sentence => tokenizer.encode(' ' + sentence).length);
    const chunks = [];
    let currentChunk = [];
    let currentLength = 0;
    sentences.forEach((sentence, i) => {
        const tokenCount = nTokens[i];
        if (tokenCount > maxTokens) {
            // Split long sentences
            const subSentences = sentence.split(/[,;:]/).filter(s => s.trim());
            let subChunk = [];
            let subLength = 0;
            subSentences.forEach(subSentence => {
                const subTokenCount = tokenizer.encode(' ' + subSentence).length;
                if (subLength + subTokenCount > maxTokens) {
                    if (subChunk.length > 0) {
                        chunks.push(subChunk.join(' '));
                        subChunk = overlap > 0 ? subChunk.slice(-overlap) : [];
                        subLength = subChunk.reduce((sum, s) => sum + tokenizer.encode(' ' + s).length, 0);
                    }
                }
                subChunk.push(subSentence);
                subLength += subTokenCount;
            });
            if (subChunk.length > 0) {
                chunks.push(subChunk.join(' '));
            }
        }
        else if (currentLength + tokenCount > maxTokens) {
            chunks.push(currentChunk.join(' '));
            currentChunk = overlap > 0 ? currentChunk.slice(-overlap) : [];
            currentLength = currentChunk.reduce((sum, s) => sum + tokenizer.encode(' ' + s).length, 0);
            currentChunk.push(sentence);
            currentLength += tokenCount;
        }
        else {
            currentChunk.push(sentence);
            currentLength += tokenCount;
        }
    });
    if (currentChunk.length > 0) {
        chunks.push(currentChunk.join(' '));
    }
    return chunks;
}
function cosineDistance(a, b) {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return 1 - dotProduct / (normA * normB);
}
function distancesFromEmbeddings(queryEmbedding, embeddings, distanceMetric = 'cosine') {
    if (distanceMetric === 'cosine') {
        return embeddings.map(embedding => cosineDistance(queryEmbedding, embedding));
    }
    throw new Error(`Unsupported distance metric: ${distanceMetric}`);
}
function indicesOfNearestNeighborsFromDistances(distances) {
    return distances
        .map((dist, index) => ({ dist, index }))
        .sort((a, b) => a.dist - b.dist)
        .map(item => item.index);
}
function getNodeList(nodeDict) {
    const indices = Array.from(nodeDict.keys()).sort((a, b) => a - b);
    return indices.map(index => nodeDict.get(index));
}
function getEmbeddings(nodeList, embeddingModel) {
    const embeddings = [];
    for (const node of nodeList) {
        const embedding = node.embeddings[embeddingModel];
        if (embedding) {
            embeddings.push(embedding);
        }
        else {
            // Handle missing embeddings - you might want to throw an error or use a default
            console.warn(`Missing embedding for model ${embeddingModel} in node ${node.index}`);
            // You could either skip this node or throw an error
            // For now, we'll skip it by not adding it to the array
        }
    }
    return embeddings;
}
function getText(nodeList) {
    return nodeList.map(node => node.text.split('\n').join(' ')).join('\n\n');
}
//# sourceMappingURL=utils.js.map