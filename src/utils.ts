// src/utils.ts
import { encoding_for_model } from 'tiktoken';
import * as _ from 'lodash';
import { Node } from './tree_structures';

export function reverseMapping(layerToNodes: Map<number, Node[]>): Map<number, number> {
  const nodeToLayer = new Map<number, number>();
  layerToNodes.forEach((nodes, layer) => {
    nodes.forEach(node => {
      nodeToLayer.set(node.index, layer);
    });
  });
  return nodeToLayer;
}

export function splitText(
  text: string,
  tokenizer: any,
  maxTokens: number,
  overlap: number = 0
): string[] {
  const delimiters = ['.', '!', '?', '\n'];
  const regexPattern = new RegExp(delimiters.map(d => _.escapeRegExp(d)).join('|'), 'g');
  const sentences = text.split(regexPattern).filter(s => s.trim());
  
  const nTokens = sentences.map(sentence => tokenizer.encode(' ' + sentence).length);
  
  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentLength = 0;
  
  sentences.forEach((sentence, i) => {
    const tokenCount = nTokens[i];
    
    if (tokenCount > maxTokens) {
      // Split long sentences
      const subSentences = sentence.split(/[,;:]/).filter(s => s.trim());
      let subChunk: string[] = [];
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
    } else if (currentLength + tokenCount > maxTokens) {
      chunks.push(currentChunk.join(' '));
      currentChunk = overlap > 0 ? currentChunk.slice(-overlap) : [];
      currentLength = currentChunk.reduce((sum, s) => sum + tokenizer.encode(' ' + s).length, 0);
      currentChunk.push(sentence);
      currentLength += tokenCount;
    } else {
      currentChunk.push(sentence);
      currentLength += tokenCount;
    }
  });
  
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '));
  }
  
  return chunks;
}

export function cosineDistance(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return 1 - dotProduct / (normA * normB);
}

export function distancesFromEmbeddings(
  queryEmbedding: number[],
  embeddings: number[][],
  distanceMetric: string = 'cosine'
): number[] {
  if (distanceMetric === 'cosine') {
    return embeddings.map(embedding => cosineDistance(queryEmbedding, embedding));
  }
  throw new Error(`Unsupported distance metric: ${distanceMetric}`);
}

export function indicesOfNearestNeighborsFromDistances(distances: number[]): number[] {
  return distances
    .map((dist, index) => ({ dist, index }))
    .sort((a, b) => a.dist - b.dist)
    .map(item => item.index);
}

export function getNodeList(nodeDict: Map<number, Node>): Node[] {
  const indices = Array.from(nodeDict.keys()).sort((a, b) => a - b);
  return indices.map(index => nodeDict.get(index)!);
}

export function getEmbeddings(nodeList: Node[], embeddingModel: string): number[][] {
  const embeddings: number[][] = [];
  for (const node of nodeList) {
    const embedding = node.embeddings[embeddingModel];
    if (embedding) {
      embeddings.push(embedding);
    } else {
      // Handle missing embeddings - you might want to throw an error or use a default
      console.warn(`Missing embedding for model ${embeddingModel} in node ${node.index}`);
      // You could either skip this node or throw an error
      // For now, we'll skip it by not adding it to the array
    }
  }
  return embeddings;
}

export function getText(nodeList: Node[]): string {
  return nodeList.map(node => node.text.split('\n').join(' ')).join('\n\n');
}