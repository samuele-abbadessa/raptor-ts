# 🦖 RAPTOR-TS

A TypeScript implementation of RAPTOR (Recursive Abstractive Processing for Tree-Organized Retrieval), originally created by **Parth Sarthi** ([@parthsarthi03](https://github.com/parthsarthi03)).

This is a complete TypeScript port of the [original Python implementation](https://github.com/parthsarthi03/raptor), bringing the power of recursive document processing and tree-organized retrieval to the JavaScript/TypeScript ecosystem.

## 📋 Overview

RAPTOR introduces a novel approach to retrieval-augmented language models by constructing a recursive tree structure from documents. This allows for more efficient and context-aware information retrieval across large texts, addressing common limitations in traditional language models.

### Key Features

- 🌳 **Recursive Tree Construction**: Build hierarchical document representations
- 📄 **Advanced Document Management**: Store documents with rich metadata and efficient reference-based indexing
- 📊 **Smart Incremental Indexing**: Automatically optimize between incremental updates and full reindexing
- 🗂️ **Document Collections**: Organize documents into collections for better management
- 🔄 **Flexible Chunking Strategies**: Plug in custom chunking algorithms for different document types
- 🔍 **Metadata-Based Filtering**: Search and filter documents using metadata
- 💾 **Efficient Storage**: Document references reduce index size by 60-80%
- 🚀 **Performance Optimized**: Reuse embeddings and clustering information across reindexing
- 🔧 **Extensible Architecture**: Easily swap embedding, summarization, and QA models
- 💻 **TypeScript Native**: Full type safety and modern JavaScript features

## 🎯 Use Cases

RAPTOR-TS is perfect for:

- **Document Q&A Systems**: Build intelligent document search and question-answering systems
- **Knowledge Base Management**: Organize and query large knowledge bases efficiently
- **Research Tools**: Analyze and extract insights from academic papers or reports
- **Content Summarization**: Generate multi-level summaries of long documents
- **RAG Applications**: Enhance retrieval-augmented generation with hierarchical context
- **Multi-Document Analysis**: Process and query across document collections
- **Version-Controlled Documentation**: Track and index document changes over time

## 🚀 Installation

```bash
npm install raptor-ts
```

## 🛠️ Quick Start

### Basic Usage

```typescript
import { RetrievalAugmentation } from 'raptor-ts';

// Set your OpenAI API key
process.env.OPENAI_API_KEY = 'your-openai-api-key';

async function main() {
  // Initialize RAPTOR with default configuration
  const raptor = new RetrievalAugmentation();

  // Load and process your documents
  const document = `Your document text here...`;
  await raptor.addDocuments(document);

  // Ask questions about your documents
  const answer = await raptor.answerQuestion(
    "What is the main topic of this document?"
  );
  console.log("Answer:", answer);

  // Save the tree for later use
  raptor.save("./my-tree.json");
}

main();
```

## 📂 Document Management

RAPTOR-TS now includes a powerful document management system that separates document storage from indexing, providing better flexibility and performance.

### Adding Documents with Metadata

```typescript
import { RetrievalAugmentation } from 'raptor-ts';

const raptor = new RetrievalAugmentation();

// Add a single document with rich metadata
const docId = await raptor.addDocument({
  content: "Your document content here...",
  metadata: {
    source: "https://example.com/article",
    contentType: "markdown",
    author: "John Doe",
    tags: ["AI", "machine-learning"],
    createdAt: new Date(),
    updatedAt: new Date(),
    // Add any custom metadata fields
    department: "Research",
    version: "1.2.0"
  }
});

console.log(`Document added with ID: ${docId}`);
```

### Batch Document Processing

```typescript
// Add multiple documents at once
const documents = [
  {
    content: "First document content...",
    metadata: {
      contentType: "plain",
      tags: ["intro"],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  },
  {
    content: "Second document content...",
    metadata: {
      contentType: "markdown",
      tags: ["technical"],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }
];

const docIds = await raptor.addDocumentsBatch(documents, {
  collection: "technical-docs",  // Organize into collections
  batchSize: 10  // Process in batches for better performance
});
```

### Document Collections

Organize related documents into collections for better management:

```typescript
// Create and populate a collection
const docIds = await raptor.addDocumentsBatch(documents, {
  collection: "research-papers-2024"
});

// Add an entire collection to the index
await raptor.addCollection("research-papers-2024");
```

### Metadata-Based Search

Query your document storage using rich metadata filters:

```typescript
import { FileSystemDocumentStorage } from 'raptor-ts';

const storage = new FileSystemDocumentStorage();

// Search documents by metadata
const results = await storage.search({
  tags: ["AI", "machine-learning"],
  contentType: "markdown",
  author: "John Doe",
  afterDate: new Date("2024-01-01"),
  beforeDate: new Date("2024-12-31"),
  // Custom metadata filter function
  metadataFilter: (metadata) => metadata.version?.startsWith("1.")
});

console.log(`Found ${results.length} matching documents`);
```

## 🔄 Smart Incremental Indexing

RAPTOR-TS now includes intelligent incremental indexing that automatically decides when to reindex based on document changes:

```typescript
// Monitor indexing statistics
const stats = await raptor.getIndexingStats();
console.log(`Total documents: ${stats.totalDocuments}`);
console.log(`Total tokens: ${stats.totalTokens}`);
console.log(`Documents until automatic reindex: ${stats.documentsUntilReindex}`);

// The system automatically decides when to reindex based on:
// - Token count increase (default: 10% threshold)
// - Number of new documents (default: 10 documents)
// - Manual trigger

// Force reindexing when needed
await raptor.forceReindex();
```

### Incremental Indexing Benefits

- **Automatic Optimization**: System decides when incremental updates vs full reindexing is more efficient
- **Embedding Reuse**: Cached embeddings are reused during reindexing, saving API calls
- **Clustering Preservation**: Clustering information is preserved across reindexing operations
- **State Persistence**: Indexing state is saved to disk for recovery and optimization

## ✂️ Custom Chunking Strategies

Implement custom chunking strategies for different document types:

```typescript
import { ChunkingStrategy, Document, Chunk } from 'raptor-ts';

// Create a custom chunking strategy
class ParagraphChunking implements ChunkingStrategy {
  async chunk(document: Document): Promise<Chunk[]> {
    const paragraphs = document.content.split('\n\n');
    const chunks: Chunk[] = [];
    let charOffset = 0;
    
    for (let i = 0; i < paragraphs.length; i++) {
      chunks.push({
        content: paragraphs[i],
        documentRef: {
          documentId: document.id,
          charStart: charOffset,
          charEnd: charOffset + paragraphs[i].length,
          tokenStart: 0,  // Calculate actual tokens
          tokenEnd: 0
        },
        metadata: new Map([
          ...Object.entries(document.metadata),
          ['chunkIndex', i],
          ['chunkingStrategy', 'paragraph']
        ])
      });
      charOffset += paragraphs[i].length + 2; // +2 for \n\n
    }
    
    return chunks;
  }
}

// Use custom chunking
await raptor.addDocument({
  content: "Paragraph 1...\n\nParagraph 2...\n\nParagraph 3...",
  metadata: { createdAt: new Date(), updatedAt: new Date() }
}, {
  chunkingStrategy: new ParagraphChunking()
});
```

## 💾 Efficient Storage with Document References

The new architecture uses document references instead of embedded text, providing significant benefits:

### Storage Efficiency
- **60-80% smaller index files**: Only store references, not full text
- **Separate document storage**: Documents stored once, referenced many times
- **Lazy loading**: Text loaded only when needed during retrieval

### File Structure
```
./document_storage/
├── content/           # Document content files
│   ├── doc_uuid1.txt
│   └── doc_uuid2.txt
├── metadata/          # Document metadata
│   ├── doc_uuid1.json
│   └── doc_uuid2.json
└── index.json         # Document index

./indexing_states/     # Indexing state for optimization
└── idx_uuid.json
```

## 📁 Saving and Loading Trees

RAPTOR-TS allows you to save processed document trees to disk and reload them later, avoiding the need to reprocess documents and saving on API costs.

### Saving a Tree

```typescript
import { RetrievalAugmentation } from 'raptor-ts';

async function saveExample() {
  const raptor = new RetrievalAugmentation();
  
  // Process your documents
  await raptor.addDocuments("Your document text...");
  
  // Save the tree to a file (now with document references)
  raptor.save('./my-tree.json');
}
```

### Loading a Tree

```typescript
import { RetrievalAugmentation } from 'raptor-ts';

// Load tree directly into a new instance
const raptor = RetrievalAugmentation.fromFile('./my-tree.json');

// Use immediately for questions
const answer = await raptor.answerQuestion("Your question here?");
```

## 🎛️ Advanced Configuration

```typescript
import { 
  RetrievalAugmentation,
  RetrievalAugmentationConfig,
  ClusterTreeConfig,
  TreeRetrieverConfig,
  GPT4QAModel,
  SBertEmbeddingModel 
} from 'raptor-ts';

// Custom configuration with different models
const config = new RetrievalAugmentationConfig({
  treeBuilderConfig: new ClusterTreeConfig({
    maxTokens: 200,
    numLayers: 3,
    embeddingModels: new Map([
      ['sbert', new SBertEmbeddingModel()]
    ]),
    clusterEmbeddingModel: 'sbert'
  }),
  treeRetrieverConfig: new TreeRetrieverConfig({
    topK: 10,
    threshold: 0.7
  }),
  qaModel: new GPT4QAModel()
});

const raptor = new RetrievalAugmentation(config);
```

## 📚 API Reference

### Main Classes

#### `RetrievalAugmentation`
The main orchestrator class for document processing and retrieval.

```typescript
const ra = new RetrievalAugmentation(config?, tree?);

// Document management
await ra.addDocument(document, options?);
await ra.addDocumentsBatch(documents, options?);
await ra.addCollection(collectionId);

// Indexing control
await ra.getIndexingStats();
await ra.forceReindex();

// Query and retrieval
await ra.answerQuestion(question: string, options?);
await ra.retrieve(question: string, options?);

// Persistence
ra.save(path: string);
```

#### `DocumentStorage`
Interface for document storage operations.

```typescript
interface DocumentStorage {
  save(document: Omit<Document, 'id'>): Promise<string>;
  get(id: string): Promise<Document | null>;
  update(id: string, document: Partial<Document>): Promise<void>;
  delete(id: string): Promise<void>;
  list(): Promise<DocumentInfo[]>;
  search(query: DocumentQuery): Promise<DocumentInfo[]>;
}
```

#### `ChunkingStrategy`
Interface for custom chunking implementations.

```typescript
interface ChunkingStrategy {
  chunk(document: Document): Promise<Chunk[]>;
}
```

### Extending RAPTOR

You can create custom models by extending the base classes:

```typescript
import { BaseEmbeddingModel, BaseSummarizationModel, BaseQAModel } from 'raptor-ts';

class MyCustomEmbeddingModel extends BaseEmbeddingModel {
  async createEmbedding(text: string): Promise<number[]> {
    // Your implementation
  }
}

class MyCustomSummarizer extends BaseSummarizationModel {
  async summarize(context: string, maxTokens?: number): Promise<string> {
    // Your implementation
  }
}

class MyCustomQAModel extends BaseQAModel {
  async answerQuestion(context: string, question: string): Promise<string> {
    // Your implementation
  }
}
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE.txt) file for details.

## 🙏 Acknowledgments

- **Original Python Implementation**: [Parth Sarthi](https://github.com/parthsarthi03) - Creator of the original RAPTOR algorithm and [Python implementation](https://github.com/parthsarthi03/raptor)
- **Paper**: [RAPTOR: Recursive Abstractive Processing for Tree-Organized Retrieval](https://arxiv.org/abs/2401.18059)
- Built with TypeScript, OpenAI API, and various open-source libraries

## 📖 Citation

If you use RAPTOR-TS in your research, please cite the original paper:

```bibtex
@inproceedings{sarthi2024raptor,
    title={RAPTOR: Recursive Abstractive Processing for Tree-Organized Retrieval},
    author={Sarthi, Parth and Abdullah, Salman and Tuli, Aditi and Khanna, Shubh and Goldie, Anna and Manning, Christopher D.},
    booktitle={International Conference on Learning Representations (ICLR)},
    year={2024}
}
```

## 📗 Links

- [NPM Package](https://www.npmjs.com/package/raptor-ts)
- [Original Python Implementation](https://github.com/parthsarthi03/raptor)
- [Research Paper](https://arxiv.org/abs/2401.18059)
- [Documentation](https://github.com/samuele-abbadessa/raptor-ts)

---

## Project Files:

**Path**: LICENSE.txt

**Content**:
The MIT License

Copyright (c) Angelo Samuele Abbadessa

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

---

**Path**: package.json

**Content**:
{
  "name": "raptor-ts",
  "version": "1.0.3",
  "description": "TypeScript implementation of RAPTOR (Recursive Abstractive Processing for Tree-Organized Retrieval)",
  "main": "dist/index.js",
  "module": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "tsc",
    "dev": "ts-node src/index.ts",
    "test": "jest",
    "lint": "eslint src/**/*.ts"
  },
  "keywords": [
    "raptor",
    "nlp",
    "retrieval",
    "rag",
    "embeddings",
    "typescript"
  ],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "@xenova/transformers": "^2.0.0",
    "lodash": "^4.17.21",
    "mathjs": "^12.0.0",
    "openai": "^4.0.0",
    "tiktoken": "^1.0.0",
    "umap-js": "^1.3.3",
    "uuid": "^13.0.0"
  },
  "devDependencies": {
    "@types/jest": "^29.0.0",
    "@types/lodash": "^4.14.0",
    "@types/node": "^20.0.0",
    "@types/uuid": "^10.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.0.0",
    "jest": "^29.0.0",
    "ts-node": "^10.0.0",
    "typescript": "^5.0.0"
  }
}


---

**Path**: src/cluster_tree_builder.ts

**Content**:
import { TreeBuilder, TreeBuilderConfig } from './tree_builder';
import { Node, Tree } from './tree_structures';
import { ClusteringAlgorithm, RAPTORClustering } from './clustering';
import { getNodeList, getText } from './utils';

export class ClusterTreeConfig extends TreeBuilderConfig {
  reductionDimension: number;
  clusteringAlgorithm: ClusteringAlgorithm;
  clusteringParams: any;

  constructor(params: Partial<ClusterTreeConfig> = {}) {
    super(params);
    this.reductionDimension = params.reductionDimension || 10;
    this.clusteringAlgorithm = params.clusteringAlgorithm || new RAPTORClustering();
    this.clusteringParams = params.clusteringParams || {};
  }
}

export class ClusterTreeBuilder extends TreeBuilder {
  private reductionDimension: number;
  private clusteringAlgorithm: ClusteringAlgorithm;
  private clusteringParams: any;

  constructor(config: ClusterTreeConfig) {
    super(config);
    this.reductionDimension = config.reductionDimension;
    this.clusteringAlgorithm = config.clusteringAlgorithm;
    this.clusteringParams = config.clusteringParams;
  }

  async constructTree(
    currentLevelNodes: Map<number, Node>,
    allTreeNodes: Map<number, Node>,
    layerToNodes: Map<number, Node[]>
  ): Promise<Map<number, Node>> {
    console.log('Using Cluster TreeBuilder');
    let nextNodeIndex = allTreeNodes.size;

    for (let layer = 0; layer < this.numLayers; layer++) {
      const newLevelNodes = new Map<number, Node>();
      console.log(`Constructing Layer ${layer}`);
      
      const nodeListCurrentLayer = getNodeList(currentLevelNodes);
      
      if (nodeListCurrentLayer.length <= this.reductionDimension + 1) {
        this.numLayers = layer;
        console.log(`Stopping Layer construction: Cannot Create More Layers. Total Layers in tree: ${layer}`);
        break;
      }
      
      const clusters = await this.clusteringAlgorithm.performClustering(
        nodeListCurrentLayer,
        this.clusterEmbeddingModel,
        undefined,
        this.tokenizer,
        this.reductionDimension,
        this.clusteringParams.threshold,
        this.clusteringParams.verbose
      );
      
      for (const cluster of clusters) {
        const nodeTexts = getText(cluster);
        const summarizedText = await this.summarize(nodeTexts, this.summarizationLength);
        
        console.log(
          `Node Texts Length: ${this.tokenizer.encode(nodeTexts).length}, ` +
          `Summarized Text Length: ${this.tokenizer.encode(summarizedText).length}`
        );
        
        const childrenIndices = new Set(cluster.map(node => node.index));
        const [_, newParentNode] = await this.createNode(
          nextNodeIndex,
          summarizedText,
          childrenIndices
        );
        
        newLevelNodes.set(nextNodeIndex, newParentNode);
        nextNodeIndex++;
      }
      
      layerToNodes.set(layer + 1, Array.from(newLevelNodes.values()));
      currentLevelNodes = newLevelNodes;
      
      for (const [index, node] of newLevelNodes) {
        allTreeNodes.set(index, node);
      }
    }
    
    return currentLevelNodes;
  }
}

---

**Path**: src/clustering.ts

**Content**:
// src/clustering.ts
import { UMAP } from 'umap-js';
import { encoding_for_model } from 'tiktoken';
import { Node } from './tree_structures';
import { GaussianMixture } from './gmm';

export interface ClusteringAlgorithm {
  performClustering(
    nodes: Node[],
    embeddingModelName: string,
    maxLengthInCluster?: number,
    tokenizer?: any,
    reductionDimension?: number,
    threshold?: number,
    verbose?: boolean
  ): Promise<Node[][]>;
}

/**
 * Normalize embeddings to unit vectors, making Euclidean distance equivalent to cosine distance
 * This is a common preprocessing step for high-dimensional embeddings
 */
export function normalizeEmbeddings(embeddings: number[][]): number[][] {
  return embeddings.map(embedding => {
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (norm === 0) {
      console.warn('Zero-norm embedding detected, returning original vector');
      return embedding;
    }
    return embedding.map(val => val / norm);
  });
}

/**
 * Compute cosine distance matrix for precomputed UMAP usage
 */
export function computeCosineDistanceMatrix(embeddings: number[][]): number[][] {
  const n = embeddings.length;
  const distanceMatrix = Array(n).fill(null).map(() => Array(n).fill(0));
  
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      if (i === j) {
        distanceMatrix[i][j] = 0;
      } else {
        const distance = cosineDistance(embeddings[i], embeddings[j]);
        distanceMatrix[i][j] = distance;
        distanceMatrix[j][i] = distance; // Symmetric matrix
      }
    }
  }
  
  return distanceMatrix;
}

/**
 * Calculate cosine distance between two vectors
 */
function cosineDistance(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  
  if (normA === 0 || normB === 0) {
    return 1; // Maximum distance for zero vectors
  }
  
  return 1 - dotProduct / (normA * normB);
}

export function globalClusterEmbeddings(
  embeddings: number[][],
  dim: number,
  nNeighbors?: number
): number[][] {
  if (!nNeighbors) {
    nNeighbors = Math.floor(Math.sqrt(embeddings.length - 1));
  }
  
  // Normalize embeddings (fast and nearly equivalent)
  console.log('Normalizing embeddings to unit vectors for cosine-like distance');
  const normalizedEmbeddings = normalizeEmbeddings(embeddings);
  
  const umap = new UMAP({
    nNeighbors,
    nComponents: dim,
    // With normalized vectors, Euclidean distance ≈ cosine distance
    // ||a||=||b||=1 → ||a-b||² = 2(1 - a·b) = 2 * cosine_distance
  });
  
  return umap.fit(normalizedEmbeddings);
}

export function getOptimalClusters(
  embeddings: number[][],
  maxClusters: number = 50,
  randomState: number = 224
): number {
  maxClusters = Math.min(maxClusters, embeddings.length);
  const nClusters = Array.from({ length: maxClusters - 1 }, (_, i) => i + 1);
  
  // Normalize embeddings if using cosine-based clustering
  const processedEmbeddings = normalizeEmbeddings(embeddings);
  
  const bics = nClusters.map(n => {
    const gm = new GaussianMixture(n, { seed: randomState });
    gm.fit(processedEmbeddings);
    return gm.bic(processedEmbeddings);
  });
  
  const minBic = Math.min(...bics);
  const optimalIndex = bics.indexOf(minBic);
  return nClusters[optimalIndex];
}

export class RAPTORClustering implements ClusteringAlgorithm {
  async performClustering(
    nodes: Node[],
    embeddingModelName: string,
    maxLengthInCluster: number = 3500,
    tokenizer: any = encoding_for_model('gpt-3.5-turbo'),
    reductionDimension: number = 10,
    threshold: number = 0.1,
    verbose: boolean = false
  ): Promise<Node[][]> {
    const embeddings = nodes.map(node => {
      const embedding = node.embeddings[embeddingModelName];
      if (!embedding) {
        throw new Error(`Embedding for model ${embeddingModelName} not found in node ${node.index}`);
      }
      return embedding;
    });
    
    // Perform dimensionality reduction
    const reducedEmbeddings = globalClusterEmbeddings(
      embeddings,
      Math.min(reductionDimension, embeddings.length - 2),
      undefined,
    );
    
    // Use normalized embeddings for clustering if using cosine
    const clusteringEmbeddings = normalizeEmbeddings(reducedEmbeddings);
    
    const nClusters = getOptimalClusters(clusteringEmbeddings, 50, 224); // Already normalized
    const gm = new GaussianMixture(nClusters);
    gm.fit(clusteringEmbeddings);
    
    const probs = gm.predict_proba(clusteringEmbeddings);
    const labels = probs.map((prob: number[]) => 
      prob.map((p: number, i: number) => p > threshold ? i : -1)
        .filter((i: number) => i >= 0)
    );
    
    const nodeClusters: Node[][] = [];
    const uniqueLabels = new Set(labels.flat());
    
    for (const label of uniqueLabels) {
      if (label === -1) continue;
      
      const indices = labels
        .map((labelSet: number[], i: number) => labelSet.includes(label) ? i : -1)
        .filter((i: number) => i >= 0);
      
      const clusterNodes = indices.map((i: number) => nodes[i]);
      
      if (clusterNodes.length === 1) {
        nodeClusters.push(clusterNodes);
        continue;
      }
      
      const totalLength = clusterNodes.reduce(
        (sum: number, node: Node) => sum + tokenizer.encode(node.text).length,
        0
      );
      
      if (totalLength > maxLengthInCluster) {
        if (verbose) {
          console.log(`Reclustering cluster with ${clusterNodes.length} nodes`);
        }
        const subClusters = await this.performClustering(
          clusterNodes,
          embeddingModelName,
          maxLengthInCluster,
          tokenizer,
          reductionDimension,
          threshold,
          verbose
        );
        nodeClusters.push(...subClusters);
      } else {
        nodeClusters.push(clusterNodes);
      }
    }
    
    return nodeClusters;
  }
}

---

**Path**: src/document/chunking.ts

**Content**:
// src/document/chunking.ts

import { Chunk, Document, DocumentReference } from './types';
import { encoding_for_model } from 'tiktoken';
import { splitText } from '../utils';

export interface ChunkingStrategy {
  chunk(document: Document): Promise<Chunk[]>;
}

export interface ChunkingOptions {
  maxTokens?: number;
  overlap?: number;
  tokenizer?: any;
}

export class TokenBasedChunking implements ChunkingStrategy {
  private maxTokens: number;
  private overlap: number;
  private tokenizer: any;

  constructor(options: ChunkingOptions = {}) {
    this.maxTokens = options.maxTokens || 100;
    this.overlap = options.overlap || 0;
    this.tokenizer = options.tokenizer || encoding_for_model('gpt-3.5-turbo');
  }

  async chunk(document: Document): Promise<Chunk[]> {
    const chunks: Chunk[] = [];
    const text = document.content;
    
    // Use existing splitText utility
    const textChunks = splitText(text, this.tokenizer, this.maxTokens, this.overlap);
    
    let charOffset = 0;
    let tokenOffset = 0;
    
    for (let i = 0; i < textChunks.length; i++) {
      const chunkText = textChunks[i];
      const chunkTokens = this.tokenizer.encode(chunkText);
      
      // Find actual character position in original text
      const charStart = text.indexOf(chunkText, charOffset);
      const charEnd = charStart + chunkText.length;
      
      const chunk: Chunk = {
        content: chunkText,
        documentRef: {
          documentId: document.id,
          charStart,
          charEnd,
          tokenStart: tokenOffset,
          tokenEnd: tokenOffset + chunkTokens.length
        },
        metadata: new Map([
          ...Object.entries(document.metadata),
          ['chunkIndex', i],
          ['chunkingStrategy', 'token-based']
        ])
      };
      
      chunks.push(chunk);
      
      charOffset = charEnd;
      tokenOffset += chunkTokens.length;
    }
    
    return chunks;
  }
}

---

**Path**: src/document/collection.ts

**Content**:
// src/document/collection.ts

import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface DocumentCollection {
  id: string;
  name: string;
  description?: string;
  documentIds: Set<string>;
  metadata: Map<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CollectionStorage {
  createCollection(name: string, description?: string): Promise<string>;
  getCollection(id: string): Promise<DocumentCollection | null>;
  addDocumentsToCollection(collectionId: string, documentIds: string[]): Promise<void>;
  removeDocumentsFromCollection(collectionId: string, documentIds: string[]): Promise<void>;
  listCollections(): Promise<DocumentCollection[]>;
  deleteCollection(id: string): Promise<void>;
}

export class FileSystemCollectionStorage implements CollectionStorage {
  private basePath: string;
  
  constructor(storagePath: string = './document_storage/collections') {
    this.basePath = storagePath;
  }

  private async initialize(): Promise<void> {
    await fs.mkdir(this.basePath, { recursive: true });
  }

  async createCollection(name: string, description?: string): Promise<string> {
    await this.initialize();
    
    const collection: DocumentCollection = {
      id: `col_${uuidv4()}`,
      name,
      description,
      documentIds: new Set(),
      metadata: new Map(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await this.saveCollection(collection);
    return collection.id;
  }

  private async saveCollection(collection: DocumentCollection): Promise<void> {
    const filePath = path.join(this.basePath, `${collection.id}.json`);
    const data = {
      ...collection,
      documentIds: Array.from(collection.documentIds),
      metadata: Array.from(collection.metadata.entries()),
      createdAt: collection.createdAt.toISOString(),
      updatedAt: collection.updatedAt.toISOString()
    };
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  }

  async getCollection(id: string): Promise<DocumentCollection | null> {
    try {
      const filePath = path.join(this.basePath, `${id}.json`);
      const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
      return {
        ...data,
        documentIds: new Set(data.documentIds),
        metadata: new Map(data.metadata),
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt)
      };
    } catch {
      return null;
    }
  }

  async addDocumentsToCollection(
    collectionId: string, 
    documentIds: string[]
  ): Promise<void> {
    const collection = await this.getCollection(collectionId);
    if (!collection) throw new Error(`Collection ${collectionId} not found`);
    
    documentIds.forEach(id => collection.documentIds.add(id));
    collection.updatedAt = new Date();
    
    await this.saveCollection(collection);
  }

  async removeDocumentsFromCollection(
    collectionId: string,
    documentIds: string[]
  ): Promise<void> {
    const collection = await this.getCollection(collectionId);
    if (!collection) throw new Error(`Collection ${collectionId} not found`);
    
    documentIds.forEach(id => collection.documentIds.delete(id));
    collection.updatedAt = new Date();
    
    await this.saveCollection(collection);
  }

  async listCollections(): Promise<DocumentCollection[]> {
    await this.initialize();
    
    try {
      const files = await fs.readdir(this.basePath);
      const collections = await Promise.all(
        files
          .filter(f => f.endsWith('.json'))
          .map(f => this.getCollection(f.replace('.json', '')))
      );
      return collections.filter((c): c is DocumentCollection => c !== null);
    } catch {
      return [];
    }
  }

  async deleteCollection(id: string): Promise<void> {
    const filePath = path.join(this.basePath, `${id}.json`);
    await fs.unlink(filePath).catch(() => {});
  }
}

---

**Path**: src/document/storage.ts

**Content**:
// src/document/storage.ts

import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Document, DocumentInfo, DocumentMetadata } from './types';

export interface DocumentQuery {
  tags?: string[];
  contentType?: string;
  author?: string;
  afterDate?: Date;
  beforeDate?: Date;
  metadataFilter?: (metadata: DocumentMetadata) => boolean;
}

export interface DocumentStorage {
  save(document: Omit<Document, 'id'>): Promise<string>;
  get(id: string): Promise<Document | null>;
  update(id: string, document: Partial<Document>): Promise<void>;
  delete(id: string): Promise<void>;
  list(): Promise<DocumentInfo[]>;
  search(query: DocumentQuery): Promise<DocumentInfo[]>;
  exists(id: string): Promise<boolean>;
}

export class FileSystemDocumentStorage implements DocumentStorage {
  private basePath: string;
  private metadataPath: string;
  private contentPath: string;
  private indexPath: string;

  constructor(storagePath: string = './document_storage') {
    this.basePath = storagePath;
    this.metadataPath = path.join(storagePath, 'metadata');
    this.contentPath = path.join(storagePath, 'content');
    this.indexPath = path.join(storagePath, 'index.json');
  }

  async initialize(): Promise<void> {
    await fs.mkdir(this.metadataPath, { recursive: true });
    await fs.mkdir(this.contentPath, { recursive: true });
    
    // Initialize index if it doesn't exist
    try {
      await fs.access(this.indexPath);
    } catch {
      await this.saveIndex({});
    }
  }

  private generateId(): string {
    return `doc_${uuidv4()}`;
  }

  private async loadIndex(): Promise<Record<string, DocumentInfo>> {
    try {
      const data = await fs.readFile(this.indexPath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return {};
    }
  }

  private async saveIndex(index: Record<string, DocumentInfo>): Promise<void> {
    await fs.writeFile(this.indexPath, JSON.stringify(index, null, 2));
  }

  async save(document: Omit<Document, 'id'>): Promise<string> {
    await this.initialize();
    
    const id = this.generateId();
    const now = new Date();
    
    const fullDocument: Document = {
      id,
      content: document.content,
      metadata: {
        ...document.metadata,
        createdAt: document.metadata?.createdAt || now,
        updatedAt: now
      }
    };

    // Save content
    const contentFile = path.join(this.contentPath, `${id}.txt`);
    await fs.writeFile(contentFile, fullDocument.content, 'utf-8');

    // Save metadata
    const metadataFile = path.join(this.metadataPath, `${id}.json`);
    await fs.writeFile(metadataFile, JSON.stringify(fullDocument.metadata, null, 2));

    // Update index
    const index = await this.loadIndex();
    index[id] = {
      id,
      metadata: fullDocument.metadata,
      contentLength: fullDocument.content.length
    };
    await this.saveIndex(index);

    return id;
  }

  async get(id: string): Promise<Document | null> {
    try {
      const contentFile = path.join(this.contentPath, `${id}.txt`);
      const metadataFile = path.join(this.metadataPath, `${id}.json`);

      const [content, metadataStr] = await Promise.all([
        fs.readFile(contentFile, 'utf-8'),
        fs.readFile(metadataFile, 'utf-8')
      ]);

      const metadata = JSON.parse(metadataStr);
      
      return {
        id,
        content,
        metadata: {
          ...metadata,
          createdAt: new Date(metadata.createdAt),
          updatedAt: new Date(metadata.updatedAt)
        }
      };
    } catch {
      return null;
    }
  }

  async update(id: string, updates: Partial<Document>): Promise<void> {
    const existing = await this.get(id);
    if (!existing) {
      throw new Error(`Document ${id} not found`);
    }

    const updated: Document = {
      ...existing,
      ...updates,
      id, // Ensure ID cannot be changed
      metadata: {
        ...existing.metadata,
        ...updates.metadata,
        updatedAt: new Date()
      }
    };

    // Update content if provided
    if (updates.content !== undefined) {
      const contentFile = path.join(this.contentPath, `${id}.txt`);
      await fs.writeFile(contentFile, updated.content, 'utf-8');
    }

    // Update metadata
    const metadataFile = path.join(this.metadataPath, `${id}.json`);
    await fs.writeFile(metadataFile, JSON.stringify(updated.metadata, null, 2));

    // Update index
    const index = await this.loadIndex();
    index[id] = {
      id,
      metadata: updated.metadata,
      contentLength: updated.content.length
    };
    await this.saveIndex(index);
  }

  async delete(id: string): Promise<void> {
    const contentFile = path.join(this.contentPath, `${id}.txt`);
    const metadataFile = path.join(this.metadataPath, `${id}.json`);

    await Promise.all([
      fs.unlink(contentFile).catch(() => {}),
      fs.unlink(metadataFile).catch(() => {})
    ]);

    // Update index
    const index = await this.loadIndex();
    delete index[id];
    await this.saveIndex(index);
  }

  async list(): Promise<DocumentInfo[]> {
    const index = await this.loadIndex();
    return Object.values(index);
  }

  async search(query: DocumentQuery): Promise<DocumentInfo[]> {
    const allDocs = await this.list();
    
    return allDocs.filter(doc => {
      const metadata = doc.metadata;
      
      // Check tags
      if (query.tags?.length) {
        const docTags = metadata.tags || [];
        if (!query.tags.some(tag => docTags.includes(tag))) {
          return false;
        }
      }
      
      // Check content type
      if (query.contentType && metadata.contentType !== query.contentType) {
        return false;
      }
      
      // Check author
      if (query.author && metadata.author !== query.author) {
        return false;
      }
      
      // Check date range
      if (query.afterDate && new Date(metadata.createdAt) < query.afterDate) {
        return false;
      }
      
      if (query.beforeDate && new Date(metadata.createdAt) > query.beforeDate) {
        return false;
      }
      
      // Apply custom metadata filter
      if (query.metadataFilter && !query.metadataFilter(metadata)) {
        return false;
      }
      
      return true;
    });
  }

  async exists(id: string): Promise<boolean> {
    try {
      await fs.access(path.join(this.contentPath, `${id}.txt`));
      return true;
    } catch {
      return false;
    }
  }
}

---

**Path**: src/document/types.ts

**Content**:
// src/document/types.ts

export interface DocumentMetadata {
  // Standard fields
  source?: string;           // file path, URL, etc.
  createdAt: Date;
  updatedAt: Date;
  contentType?: string;      // pdf, html, markdown, plain, etc.
  author?: string;
  tags?: string[];
  
  // Custom fields
  [key: string]: any;
}

export interface Document {
  id: string;
  content: string;
  metadata: DocumentMetadata;
}

export interface DocumentReference {
  documentId: string;
  charStart: number;
  charEnd: number;
  tokenStart: number;
  tokenEnd: number;
}

export interface Chunk {
  content: string;
  documentRef: DocumentReference;
  metadata: Map<string, any>;  // Inherits from document + own metadata
}

export interface DocumentInfo {
  id: string;
  metadata: DocumentMetadata;
  contentLength: number;
  chunkCount?: number;
}

---

**Path**: src/gmm.ts

**Content**:
// src/gmm.ts
import * as math from 'mathjs';

export class GaussianMixture {
  private nComponents: number;
  private maxIter: number;
  private tol: number;
  private randomState: number | null;
  
  private weights: number[] = [];
  private means: number[][] = [];
  private covariances: number[][][] = [];
  private converged: boolean = false;
  
  constructor(nComponents: number, options: { 
    maxIter?: number, 
    tol?: number, 
    seed?: number 
  } = {}) {
    this.nComponents = nComponents;
    this.maxIter = options.maxIter || 100;
    this.tol = options.tol || 1e-3;
    this.randomState = options.seed || null;
  }
  
  private seedRandom(seed: number): () => number {
    let s = seed;
    return () => {
      s = Math.sin(s) * 10000;
      return s - Math.floor(s);
    };
  }
  
  private initializeParameters(data: number[][]): void {
    const n = data.length;
    const d = data[0].length;
    const rng = this.randomState ? this.seedRandom(this.randomState) : Math.random;
    
    // Initialize weights uniformly
    this.weights = new Array(this.nComponents).fill(1.0 / this.nComponents);
    
    // Initialize means using random samples from data
    const indices = new Set<number>();
    while (indices.size < this.nComponents) {
      indices.add(Math.floor(rng() * n));
    }
    this.means = Array.from(indices).map(i => [...data[i]]);
    
    // Initialize covariances as identity matrices
    this.covariances = Array(this.nComponents).fill(null).map(() => {
      const cov = Array(d).fill(null).map(() => Array(d).fill(0));
      for (let i = 0; i < d; i++) {
        cov[i][i] = 1.0;
      }
      return cov;
    });
  }
  
  private gaussianPdf(x: number[], mean: number[], cov: number[][]): number {
    const d = x.length;
    const diff = x.map((xi, i) => xi - mean[i]);
    
    // Add small regularization to diagonal for numerical stability
    const regularizedCov = cov.map((row, i) => 
      row.map((val, j) => i === j ? val + 1e-6 : val)
    );
    
    try {
      const covInv = math.inv(regularizedCov) as number[][];
      const det = math.det(regularizedCov) as number;
      
      if (det <= 0) {
        return 1e-10; // Return small probability for singular matrices
      }
      
      const temp = math.multiply(diff, covInv) as number[];
      const mahalanobis = math.dot(temp, diff) as number;
      
      const coefficient = 1.0 / Math.sqrt(Math.pow(2 * Math.PI, d) * det);
      return coefficient * Math.exp(-0.5 * mahalanobis);
    } catch (e) {
      // Handle singular matrix case
      return 1e-10;
    }
  }
  
  private eStep(data: number[][]): number[][] {
    const n = data.length;
    const responsibilities = Array(n).fill(null).map(() => Array(this.nComponents).fill(0));
    
    for (let i = 0; i < n; i++) {
      let sumProb = 0;
      for (let k = 0; k < this.nComponents; k++) {
        const prob = this.weights[k] * this.gaussianPdf(data[i], this.means[k], this.covariances[k]);
        responsibilities[i][k] = prob;
        sumProb += prob;
      }
      
      // Normalize
      if (sumProb > 0) {
        for (let k = 0; k < this.nComponents; k++) {
          responsibilities[i][k] /= sumProb;
        }
      }
    }
    
    return responsibilities;
  }
  
  private mStep(data: number[][], responsibilities: number[][]): void {
    const n = data.length;
    const d = data[0].length;
    
    for (let k = 0; k < this.nComponents; k++) {
      const nk = responsibilities.reduce((sum, r) => sum + r[k], 0);
      
      if (nk < 1e-10) {
        continue; // Skip empty clusters
      }
      
      // Update weight
      this.weights[k] = nk / n;
      
      // Update mean
      const newMean = Array(d).fill(0);
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < d; j++) {
          newMean[j] += responsibilities[i][k] * data[i][j];
        }
      }
      this.means[k] = newMean.map(m => m / nk);
      
      // Update covariance
      const newCov = Array(d).fill(null).map(() => Array(d).fill(0));
      for (let i = 0; i < n; i++) {
        const diff = data[i].map((x, j) => x - this.means[k][j]);
        for (let j = 0; j < d; j++) {
          for (let l = 0; l < d; l++) {
            newCov[j][l] += responsibilities[i][k] * diff[j] * diff[l];
          }
        }
      }
      this.covariances[k] = newCov.map(row => row.map(val => val / nk));
    }
  }
  
  private computeLogLikelihood(data: number[][]): number {
    const n = data.length;
    let logLikelihood = 0;
    
    for (let i = 0; i < n; i++) {
      let prob = 0;
      for (let k = 0; k < this.nComponents; k++) {
        prob += this.weights[k] * this.gaussianPdf(data[i], this.means[k], this.covariances[k]);
      }
      logLikelihood += Math.log(Math.max(prob, 1e-10));
    }
    
    return logLikelihood;
  }
  
  fit(data: number[][]): void {
    if (data.length < this.nComponents) {
      throw new Error(`Number of samples (${data.length}) must be >= number of components (${this.nComponents})`);
    }
    
    this.initializeParameters(data);
    
    let prevLogLikelihood = -Infinity;
    
    for (let iter = 0; iter < this.maxIter; iter++) {
      // E-step
      const responsibilities = this.eStep(data);
      
      // M-step
      this.mStep(data, responsibilities);
      
      // Check convergence
      const logLikelihood = this.computeLogLikelihood(data);
      if (Math.abs(logLikelihood - prevLogLikelihood) < this.tol) {
        this.converged = true;
        break;
      }
      prevLogLikelihood = logLikelihood;
    }
  }
  
  predict_proba(data: number[][]): number[][] {
    return this.eStep(data);
  }
  
  bic(data: number[][]): number {
    const n = data.length;
    const d = data[0].length;
    
    // Number of parameters: weights (k-1) + means (k*d) + covariances (k*d*(d+1)/2)
    const nParams = (this.nComponents - 1) + 
                    (this.nComponents * d) + 
                    (this.nComponents * d * (d + 1) / 2);
    
    const logLikelihood = this.computeLogLikelihood(data);
    return -2 * logLikelihood + nParams * Math.log(n);
  }
  
  predict(data: number[][]): number[] {
    const proba = this.predict_proba(data);
    return proba.map(p => p.indexOf(Math.max(...p)));
  }
}

---

**Path**: src/index.ts

**Content**:
// src/index.ts

export { 
  Node, 
  Tree, 
  Embeddings,
  SerializedNode,
  SerializedTree,
  DocumentReferenceNode
} from './tree_structures';

export {
  BaseEmbeddingModel,
  BaseSummarizationModel,
  BaseQAModel,
  BaseRetriever,
  OpenAIEmbeddingModel,
  SBertEmbeddingModel,
  GPT3TurboSummarizationModel,
  GPT3SummarizationModel,
  GPT3TurboQAModel,
  GPT4QAModel,
  GPT3QAModel
} from './models';

export { TreeBuilder, TreeBuilderConfig } from './tree_builder';
export { ClusterTreeBuilder, ClusterTreeConfig } from './cluster_tree_builder';
export { TreeRetriever, TreeRetrieverConfig } from './tree_retriever';
export { ClusteringAlgorithm, RAPTORClustering } from './clustering';
export { 
  RetrievalAugmentation, 
  RetrievalAugmentationConfig,
  BatchAddOptions
} from './retrieval_augmentation';

// Document management exports
export {
  Document,
  DocumentMetadata,
  DocumentReference,
  Chunk,
  DocumentInfo
} from './document/types';

export {
  DocumentStorage,
  DocumentQuery,
  FileSystemDocumentStorage
} from './document/storage';

export {
  ChunkingStrategy,
  ChunkingOptions,
  TokenBasedChunking
} from './document/chunking';

export {
  DocumentCollection,
  CollectionStorage,
  FileSystemCollectionStorage
} from './document/collection';

// Indexing exports
export {
  IndexingState,
  LayerState,
  ClusterInfo,
  IndexingConfig
} from './indexing/types';

export {
  IncrementalIndexer
} from './indexing/incremental_indexer';

export {
  IndexingStateStorage,
  FileSystemIndexingStateStorage
} from './indexing/state_storage';

// Utility exports
export * from './utils';

---

**Path**: src/indexing/incremental_indexer.ts

**Content**:
// src/indexing/incremental_indexer.ts

import { v4 as uuidv4 } from 'uuid';
import { encoding_for_model } from 'tiktoken';
import { IndexingState, LayerState, ClusterInfo, IndexingConfig } from './types';
import { IndexingStateStorage } from './state_storage';
import { DocumentStorage } from '../document/storage';
import { Document, Chunk } from '../document/types';
import { TokenBasedChunking } from '../document/chunking';
import { Tree, Node, SerializedTree } from '../tree_structures';
import { TreeBuilder } from '../tree_builder';

export class IncrementalIndexer {
  private indexingState?: IndexingState;
  private stateStorage: IndexingStateStorage;
  private documentStorage: DocumentStorage;
  private treeBuilder: TreeBuilder;
  private tokenizer: any;
  
  constructor(
    stateStorage: IndexingStateStorage,
    documentStorage: DocumentStorage,
    treeBuilder: TreeBuilder
  ) {
    this.stateStorage = stateStorage;
    this.documentStorage = documentStorage;
    this.treeBuilder = treeBuilder;
    this.tokenizer = encoding_for_model('gpt-3.5-turbo');
  }

  async loadOrCreateState(stateId?: string): Promise<IndexingState> {
    if (stateId) {
      const state = await this.stateStorage.load(stateId);
      if (state) {
        this.indexingState = state;
        return state;
      }
    }
    
    // Create new state
    this.indexingState = {
      id: `idx_${uuidv4()}`,
      createdAt: new Date(),
      lastUpdatedAt: new Date(),
      totalTokens: 0,
      totalDocuments: 0,
      documentIds: [],
      layerStates: [],
      config: {
        reindexThresholdPercent: 10,
        maxIncrementalDocuments: 10,
        preserveClusteringInfo: true,
        chunkingStrategy: 'token-based'
      }
    };
    
    return this.indexingState;
  }

  async addDocuments(
    documents: Document[],
    forceReindex: boolean = false
  ): Promise<Tree> {
    if (!this.indexingState) {
      await this.loadOrCreateState();
    }
    
    const newTokenCount = this.calculateTokenCount(documents);
    const tokenIncreasePercent = this.indexingState!.totalTokens > 0
      ? (newTokenCount / this.indexingState!.totalTokens) * 100
      : 0;
    
    const shouldReindex = forceReindex ||
      tokenIncreasePercent > this.indexingState!.config.reindexThresholdPercent ||
      documents.length > this.indexingState!.config.maxIncrementalDocuments;
    
    if (shouldReindex && this.indexingState!.totalDocuments > 0) {
      return await this.reindexWithOptimization(documents);
    } else {
      return await this.incrementalIndex(documents);
    }
  }

  private async incrementalIndex(documents: Document[]): Promise<Tree> {
    console.log('Performing incremental indexing...');
    
    // Load existing tree if available
    let tree: Tree | undefined;
    if (this.indexingState!.treeSnapshot) {
      tree = Tree.fromJSON(this.indexingState!.treeSnapshot);
    }
    
    // Process new documents
    const chunks: Chunk[] = [];
    for (const doc of documents) {
      const docChunks = await this.chunkDocument(doc);
      chunks.push(...docChunks);
      this.indexingState!.documentIds.push(doc.id);
    }
    
    // Build tree from chunks
    if (!tree || chunks.length === 0) {
      // First indexing or no new chunks
      const chunkTexts = chunks.map(c => c.content).join('\n\n');
      tree = await this.treeBuilder.buildFromText(chunkTexts);
    } else {
      // Add new chunks to existing tree (simplified approach)
      // For now, rebuild the tree with all text
      const allDocuments = await this.loadDocuments(this.indexingState!.documentIds);
      const allText = allDocuments.map(d => d.content).join('\n\n');
      this.indexingState!.totalTokens = this.calculateTokenCount(allDocuments);
      tree = await this.treeBuilder.buildFromText(allText);
    }
    
    // Update state
    this.indexingState!.totalDocuments += documents.length;
    this.indexingState!.lastUpdatedAt = new Date();
    this.indexingState!.treeSnapshot = tree.toJSON();
    
    await this.stateStorage.save(this.indexingState!);
    
    return tree;
  }

  private async reindexWithOptimization(
    newDocuments: Document[]
  ): Promise<Tree> {
    console.log('Performing optimized reindexing...');
    
    // Load all documents
    const allDocIds = [
      ...this.indexingState!.documentIds,
      ...newDocuments.map(d => d.id)
    ];
    
    const allDocuments = await this.loadDocuments(allDocIds);
    
    // Build new tree
    const allText = allDocuments.map(d => d.content).join('\n\n');
    const tree = await this.treeBuilder.buildFromText(allText);
    
    // Update state
    this.indexingState!.totalTokens = this.calculateTokenCount(allDocuments);
    this.indexingState!.totalDocuments = allDocuments.length;
    this.indexingState!.documentIds = allDocIds;
    this.indexingState!.lastUpdatedAt = new Date();
    this.indexingState!.treeSnapshot = tree.toJSON();
    
    // Save layer states for future optimization
    this.indexingState!.layerStates = this.extractLayerStates(tree);
    
    await this.stateStorage.save(this.indexingState!);
    
    return tree;
  }

  private extractLayerStates(tree: Tree): LayerState[] {
    const layerStates: LayerState[] = [];
    
    tree.layerToNodes.forEach((nodes, layer) => {
      layerStates.push({
        layer,
        nodes: nodes.map(n => n.index)
      });
    });
    
    return layerStates;
  }

  private calculateTokenCount(documents: Document[]): number {
    return documents.reduce((sum, doc) => 
      sum + this.tokenizer.encode(doc.content).length, 0);
  }

  private async chunkDocument(document: Document): Promise<Chunk[]> {
    const strategy = new TokenBasedChunking({ 
      maxTokens: this.treeBuilder.maxTokens,
      tokenizer: this.tokenizer
    });
    return strategy.chunk(document);
  }

  private async loadDocuments(ids: string[]): Promise<Document[]> {
    const docs = await Promise.all(
      ids.map(id => this.documentStorage.get(id))
    );
    return docs.filter((d): d is Document => d !== null);
  }
}

---

**Path**: src/indexing/state_storage.ts

**Content**:
// src/indexing/state_storage.ts

import * as fs from 'fs/promises';
import * as path from 'path';
import { IndexingState } from './types';

export interface IndexingStateStorage {
  save(state: IndexingState): Promise<void>;
  load(id: string): Promise<IndexingState | null>;
  list(): Promise<IndexingState[]>;
  delete(id: string): Promise<void>;
}

export class FileSystemIndexingStateStorage implements IndexingStateStorage {
  private basePath: string;
  
  constructor(storagePath: string = './indexing_states') {
    this.basePath = storagePath;
  }

  private async initialize(): Promise<void> {
    await fs.mkdir(this.basePath, { recursive: true });
  }

  async save(state: IndexingState): Promise<void> {
    await this.initialize();
    const filePath = path.join(this.basePath, `${state.id}.json`);
    
    // Convert dates to ISO strings for serialization
    const serializable = {
      ...state,
      createdAt: state.createdAt.toISOString(),
      lastUpdatedAt: state.lastUpdatedAt.toISOString()
    };
    
    await fs.writeFile(filePath, JSON.stringify(serializable, null, 2));
  }

  async load(id: string): Promise<IndexingState | null> {
    try {
      const filePath = path.join(this.basePath, `${id}.json`);
      const data = await fs.readFile(filePath, 'utf-8');
      const parsed = JSON.parse(data);
      
      // Convert ISO strings back to Date objects
      return {
        ...parsed,
        createdAt: new Date(parsed.createdAt),
        lastUpdatedAt: new Date(parsed.lastUpdatedAt)
      };
    } catch {
      return null;
    }
  }

  async list(): Promise<IndexingState[]> {
    await this.initialize();
    
    try {
      const files = await fs.readdir(this.basePath);
      const states = await Promise.all(
        files
          .filter(f => f.endsWith('.json'))
          .map(f => this.load(f.replace('.json', '')))
      );
      return states.filter((s): s is IndexingState => s !== null);
    } catch {
      return [];
    }
  }

  async delete(id: string): Promise<void> {
    const filePath = path.join(this.basePath, `${id}.json`);
    await fs.unlink(filePath).catch(() => {});
  }
}

---

**Path**: src/indexing/types.ts

**Content**:
// src/indexing/types.ts

import { SerializedTree } from '../tree_structures';

export interface IndexingState {
  id: string;
  createdAt: Date;
  lastUpdatedAt: Date;
  totalTokens: number;
  totalDocuments: number;
  documentIds: string[];
  treeSnapshot?: SerializedTree;
  layerStates: LayerState[];
  config: IndexingConfig;
}

export interface LayerState {
  layer: number;
  nodes: number[];
  clusters?: ClusterInfo[];
  embeddings?: number[][];  // Cached embeddings for reuse
}

export interface ClusterInfo {
  nodeIndices: number[];
  centroid?: number[];
  variance?: number;
}

export interface IndexingConfig {
  reindexThresholdPercent: number;  // e.g., 10 for 10%
  maxIncrementalDocuments: number;   // Max docs before forcing reindex
  preserveClusteringInfo: boolean;
  chunkingStrategy: string;
}

---

**Path**: src/models.ts

**Content**:
import { OpenAI } from 'openai';
import { pipeline } from '@xenova/transformers';

// ============= Base Models =============
export abstract class BaseEmbeddingModel {
  abstract createEmbedding(text: string): Promise<number[]>;
}

export abstract class BaseSummarizationModel {
  abstract summarize(context: string, maxTokens?: number): Promise<string>;
}

export abstract class BaseQAModel {
  abstract answerQuestion(context: string, question: string): Promise<string>;
}

export abstract class BaseRetriever {
  abstract retrieve(query: string): Promise<string>;
}

// ============= Embedding Models =============
export class OpenAIEmbeddingModel extends BaseEmbeddingModel {
  private client: OpenAI;
  
  constructor(private model: string = 'text-embedding-ada-002') {
    super();
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async createEmbedding(text: string): Promise<number[]> {
    const cleanText = text.replace(/\n/g, ' ');
    const response = await this.client.embeddings.create({
      input: [cleanText],
      model: this.model,
    });
    return response.data[0].embedding;
  }
}

export class SBertEmbeddingModel extends BaseEmbeddingModel {
  private model: any;
  private initialized = false;
  
  constructor(private modelName: string = 'sentence-transformers/all-MiniLM-L6-v2') {
    super();
  }

  private async initialize() {
    if (!this.initialized) {
      this.model = await pipeline('feature-extraction', this.modelName);
      this.initialized = true;
    }
  }

  async createEmbedding(text: string): Promise<number[]> {
    await this.initialize();
    const output = await this.model(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  }
}

// ============= Summarization Models =============
export class GPT3TurboSummarizationModel extends BaseSummarizationModel {
  private client: OpenAI;
  
  constructor(private model: string = 'gpt-3.5-turbo') {
    super();
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async summarize(context: string, maxTokens: number = 500): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { 
            role: 'user', 
            content: `Write a summary of the following, including as many key details as possible: ${context}:` 
          },
        ],
        max_tokens: maxTokens,
      });
      return response.choices[0].message.content || '';
    } catch (error) {
      console.error(error);
      return '';
    }
  }
}

export class GPT3SummarizationModel extends BaseSummarizationModel {
  private client: OpenAI;
  
  constructor(private model: string = 'text-davinci-003') {
    super();
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async summarize(context: string, maxTokens: number = 500): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { 
            role: 'user', 
            content: `Write a summary of the following, including as many key details as possible: ${context}:` 
          },
        ],
        max_tokens: maxTokens,
      });
      return response.choices[0].message.content || '';
    } catch (error) {
      console.error(error);
      return '';
    }
  }
}

// ============= QA Models =============
export class GPT3TurboQAModel extends BaseQAModel {
  private client: OpenAI;
  
  constructor(private model: string = 'gpt-3.5-turbo') {
    super();
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async answerQuestion(context: string, question: string): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: 'You are Question Answering Portal' },
          { 
            role: 'user', 
            content: `Given Context: ${context} Give the best full answer amongst the option to question ${question}` 
          },
        ],
        temperature: 0,
      });
      return response.choices[0].message.content?.trim() || '';
    } catch (error) {
      console.error(error);
      return String(error);
    }
  }
}

export class GPT4QAModel extends BaseQAModel {
  private client: OpenAI;
  
  constructor(private model: string = 'gpt-4') {
    super();
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async answerQuestion(context: string, question: string): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: 'You are Question Answering Portal' },
          { 
            role: 'user', 
            content: `Given Context: ${context} Give the best full answer amongst the option to question ${question}` 
          },
        ],
        temperature: 0,
      });
      return response.choices[0].message.content?.trim() || '';
    } catch (error) {
      console.error(error);
      return String(error);
    }
  }
}

export class GPT3QAModel extends BaseQAModel {
  private client: OpenAI;
  
  constructor(private model: string = 'text-davinci-003') {
    super();
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async answerQuestion(context: string, question: string, maxTokens: number = 150): Promise<string> {
    try {
      const response = await this.client.completions.create({
        prompt: `Using the following information ${context}. Answer the following question in less than 5-7 words, if possible: ${question}`,
        temperature: 0,
        max_tokens: maxTokens,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        model: this.model,
      });
      return response.choices[0].text.trim();
    } catch (error) {
      console.error(error);
      return '';
    }
  }
}

---

**Path**: src/retrieval_augmentation.ts

**Content**:
// src/retrieval_augmentation.ts

import { Tree, SerializedTree } from './tree_structures';
import { TreeBuilder, TreeBuilderConfig } from './tree_builder';
import { ClusterTreeBuilder, ClusterTreeConfig } from './cluster_tree_builder';
import { TreeRetriever, TreeRetrieverConfig } from './tree_retriever';
import { BaseQAModel, GPT3TurboQAModel } from './models';
import { Document } from './document/types';
import { DocumentStorage, FileSystemDocumentStorage } from './document/storage';
import { CollectionStorage, FileSystemCollectionStorage } from './document/collection';
import { ChunkingStrategy, TokenBasedChunking } from './document/chunking';
import { IncrementalIndexer } from './indexing/incremental_indexer';
import { FileSystemIndexingStateStorage } from './indexing/state_storage';
import * as fs from 'fs';
import * as path from 'path';

export interface BatchAddOptions {
  collection?: string;
  chunkingStrategy?: ChunkingStrategy;
  parallelProcessing?: boolean;
  batchSize?: number;
}

export class RetrievalAugmentationConfig {
  treeBuilderConfig: TreeBuilderConfig | ClusterTreeConfig;
  treeRetrieverConfig: TreeRetrieverConfig;
  qaModel: BaseQAModel;
  treeBuilderType: string;

  constructor(params: Partial<RetrievalAugmentationConfig> = {}) {
    this.treeBuilderType = params.treeBuilderType || 'cluster';
    this.treeBuilderConfig = params.treeBuilderConfig || 
      (this.treeBuilderType === 'cluster' ? new ClusterTreeConfig() : new TreeBuilderConfig());
    this.treeRetrieverConfig = params.treeRetrieverConfig || new TreeRetrieverConfig();
    this.qaModel = params.qaModel || new GPT3TurboQAModel();
  }
}

export class RetrievalAugmentation {
  private tree: Tree | undefined;
  private treeBuilder: TreeBuilder;
  private treeRetrieverConfig: TreeRetrieverConfig;
  private qaModel: BaseQAModel;
  private retriever: TreeRetriever | undefined;
  private documentStorage: DocumentStorage;
  private collectionStorage: CollectionStorage;
  private incrementalIndexer: IncrementalIndexer;
  private currentIndexState?: string;

  constructor(config?: RetrievalAugmentationConfig, tree?: Tree | string) {
    config = config || new RetrievalAugmentationConfig();
    
    if (typeof tree === 'string') {
      // Load from file
      this.tree = RetrievalAugmentation.load(tree);
    } else {
      this.tree = tree;
    }
    
    // Use the appropriate builder based on type
    if (config.treeBuilderType === 'cluster') {
      this.treeBuilder = new ClusterTreeBuilder(config.treeBuilderConfig as ClusterTreeConfig);
    } else {
      // For non-cluster types, you'd need to implement a concrete TreeBuilder
      // Since TreeBuilder is abstract, we'll use ClusterTreeBuilder as default
      this.treeBuilder = new ClusterTreeBuilder(
        config.treeBuilderConfig instanceof ClusterTreeConfig 
          ? config.treeBuilderConfig 
          : new ClusterTreeConfig(config.treeBuilderConfig)
      );
    }
    
    this.treeRetrieverConfig = config.treeRetrieverConfig;
    this.qaModel = config.qaModel;
    
    // Initialize storage systems
    this.documentStorage = new FileSystemDocumentStorage();
    this.collectionStorage = new FileSystemCollectionStorage();
    this.incrementalIndexer = new IncrementalIndexer(
      new FileSystemIndexingStateStorage(),
      this.documentStorage,
      this.treeBuilder
    );
    
    if (this.tree) {
      this.retriever = new TreeRetriever(this.treeRetrieverConfig, this.tree);
    }
  }

  // New method for adding documents with the document system
  async addDocumentsBatch(
    documents: Array<Omit<Document, 'id'>>,
    options: BatchAddOptions = {}
  ): Promise<string[]> {
    const savedDocIds: string[] = [];
    const savedDocs: Document[] = [];
    
    // Process in batches if specified
    const batchSize = options.batchSize || documents.length;
    
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      
      // Save documents
      const batchDocs = await Promise.all(
        batch.map(async doc => {
          const id = await this.documentStorage.save(doc);
          savedDocIds.push(id);
          const saved = await this.documentStorage.get(id);
          if (!saved) throw new Error(`Failed to save document`);
          return saved;
        })
      );
      
      savedDocs.push(...batchDocs);
    }
    
    // Add to collection if specified
    if (options.collection) {
      let collectionId = options.collection;
      
      // Check if it's a collection name or ID
      if (!collectionId.startsWith('col_')) {
        // Create new collection
        collectionId = await this.collectionStorage.createCollection(
          options.collection
        );
      }
      
      await this.collectionStorage.addDocumentsToCollection(
        collectionId,
        savedDocIds
      );
    }
    
    // Load or create indexing state
    if (!this.currentIndexState) {
      const state = await this.incrementalIndexer.loadOrCreateState();
      this.currentIndexState = state.id;
    }
    
    // Perform incremental indexing
    this.tree = await this.incrementalIndexer.addDocuments(savedDocs);
    
    // Update retriever
    this.retriever = new TreeRetriever(this.treeRetrieverConfig, this.tree);
    
    return savedDocIds;
  }

  // Backward compatibility method
  async addDocuments(docs: string): Promise<void> {
    if (this.tree) {
      console.warn('Warning: Overwriting existing tree.');
    }
    
    // Convert string to document format for backward compatibility
    const document: Omit<Document, 'id'> = {
      content: docs,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        contentType: 'plain'
      }
    };
    
    await this.addDocumentsBatch([document]);
  }

  // Add a single document
  async addDocument(
    document: Omit<Document, 'id'>,
    options: BatchAddOptions = {}
  ): Promise<string> {
    const ids = await this.addDocumentsBatch([document], options);
    return ids[0];
  }

  // Add documents from a collection
  async addCollection(
    collectionId: string,
    options: BatchAddOptions = {}
  ): Promise<void> {
    const collection = await this.collectionStorage.getCollection(collectionId);
    if (!collection) throw new Error(`Collection ${collectionId} not found`);
    
    const documents = await Promise.all(
      Array.from(collection.documentIds).map(id => 
        this.documentStorage.get(id)
      )
    );
    
    const validDocs = documents.filter((d): d is Document => d !== null);
    
    // Load or create indexing state
    if (!this.currentIndexState) {
      const state = await this.incrementalIndexer.loadOrCreateState();
      this.currentIndexState = state.id;
    }
    
    // Use incremental indexer
    this.tree = await this.incrementalIndexer.addDocuments(validDocs);
    this.retriever = new TreeRetriever(this.treeRetrieverConfig, this.tree);
  }

  // Get indexing statistics
  async getIndexingStats(): Promise<{
    totalDocuments: number;
    totalTokens: number;
    lastUpdated: Date;
    reindexThreshold: number;
    documentsUntilReindex: number;
  }> {
    if (!this.currentIndexState) {
      throw new Error('No indexing state available');
    }
    
    const state = await this.incrementalIndexer.loadOrCreateState(
      this.currentIndexState
    );
    
    const threshold = state.config.reindexThresholdPercent;
    const maxNewTokens = (state.totalTokens * threshold) / 100;
    
    // Estimate documents until reindex (rough estimate)
    const avgTokensPerDoc = state.totalDocuments > 0 
      ? state.totalTokens / state.totalDocuments 
      : 100;
    const documentsUntilReindex = Math.floor(maxNewTokens / avgTokensPerDoc);
    
    return {
      totalDocuments: state.totalDocuments,
      totalTokens: state.totalTokens,
      lastUpdated: state.lastUpdatedAt,
      reindexThreshold: threshold,
      documentsUntilReindex
    };
  }

  // Force reindexing
  async forceReindex(): Promise<void> {
    if (!this.currentIndexState) {
      throw new Error('No indexing state available');
    }
    
    const state = await this.incrementalIndexer.loadOrCreateState(
      this.currentIndexState
    );
    
    this.tree = await this.incrementalIndexer.addDocuments([], true);
    this.retriever = new TreeRetriever(this.treeRetrieverConfig, this.tree);
  }

  async retrieve(
    question: string,
    startLayer?: number,
    numLayers?: number,
    topK: number = 10,
    maxTokens: number = 3500,
    collapseTree: boolean = true,
    returnLayerInformation: boolean = true
  ): Promise<string | [string, any[]]> {
    if (!this.retriever) {
      throw new Error("The TreeRetriever instance has not been initialized. Call 'addDocuments' first.");
    }
    
    return this.retriever.retrieve(
      question,
      startLayer,
      numLayers,
      topK,
      maxTokens,
      collapseTree,
      returnLayerInformation as any
    );
  }

  async answerQuestion(
    question: string,
    topK: number = 10,
    startLayer?: number,
    numLayers?: number,
    maxTokens: number = 3500,
    collapseTree: boolean = true,
    returnLayerInformation: boolean = false
  ): Promise<string | [string, any]> {
    const result = await this.retrieve(
      question,
      startLayer,
      numLayers,
      topK,
      maxTokens,
      collapseTree,
      true
    );
    
    const [context, layerInformation] = Array.isArray(result) ? result : [result, null];
    const answer = await this.qaModel.answerQuestion(context, question);
    
    if (returnLayerInformation) {
      return [answer, layerInformation];
    }
    
    return answer;
  }

  /**
   * Save the tree to a JSON file
   * @param filePath - Path where to save the tree
   */
  save(filePath: string): void {
    if (!this.tree) {
      throw new Error('There is no tree to save.');
    }
    
    try {
      // Convert the tree to a serializable format
      const serializedTree = this.tree.toJSON();
      
      // Create directory if it doesn't exist
      const dir = path.dirname(filePath);
      if (dir && dir !== '.' && !fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Save to file with pretty formatting
      fs.writeFileSync(filePath, JSON.stringify(serializedTree, null, 2), 'utf-8');
      console.log(`Tree saved successfully to ${filePath}`);
    } catch (error) {
      console.error('Error saving tree:', error);
      throw new Error(`Failed to save tree: ${error}`);
    }
  }

  /**
   * Load a tree from a JSON file
   * @param filePath - Path to the saved tree file
   * @returns The loaded Tree object
   */
  static load(filePath: string): Tree {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }
      
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const serializedTree: SerializedTree = JSON.parse(fileContent);
      
      // Reconstruct the tree from the serialized format
      const tree = Tree.fromJSON(serializedTree);
      console.log(`Tree loaded successfully from ${filePath}`);
      return tree;
    } catch (error) {
      console.error('Error loading tree:', error);
      throw new Error(`Failed to load tree: ${error}`);
    }
  }

  /**
   * Create a new RetrievalAugmentation instance from a saved tree file
   * @param filePath - Path to the saved tree file
   * @param config - Optional configuration for the RetrievalAugmentation instance
   * @returns A new RetrievalAugmentation instance with the loaded tree
   */
  static fromFile(filePath: string, config?: RetrievalAugmentationConfig): RetrievalAugmentation {
    const tree = RetrievalAugmentation.load(filePath);
    return new RetrievalAugmentation(config, tree);
  }

  /**
   * Get the current tree (useful for inspection or debugging)
   */
  getTree(): Tree | undefined {
    return this.tree;
  }

  /**
   * Check if a tree has been loaded or built
   */
  hasTree(): boolean {
    return this.tree !== undefined;
  }
}

---

**Path**: src/tree_builder.ts

**Content**:
import { encoding_for_model } from 'tiktoken';
import { 
  Node, 
  Tree, 
  Embeddings 
} from './tree_structures';
import {
  BaseEmbeddingModel,
  BaseSummarizationModel,
  OpenAIEmbeddingModel,
  GPT3TurboSummarizationModel
} from './models';
import {
  splitText,
  getNodeList,
  getText
} from './utils';

export class TreeBuilderConfig {
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

  constructor(params: Partial<TreeBuilderConfig> = {}) {
    this.tokenizer = params.tokenizer || encoding_for_model('gpt-3.5-turbo');
    this.maxTokens = params.maxTokens || 100;
    this.numLayers = params.numLayers || 5;
    this.threshold = params.threshold || 0.5;
    this.topK = params.topK || 5;
    this.selectionMode = params.selectionMode || 'top_k';
    this.summarizationLength = params.summarizationLength || 100;
    this.summarizationModel = params.summarizationModel || new GPT3TurboSummarizationModel();
    this.embeddingModels = params.embeddingModels || new Map([['OpenAI', new OpenAIEmbeddingModel()]]);
    this.clusterEmbeddingModel = params.clusterEmbeddingModel || 'OpenAI';
  }
}

export abstract class TreeBuilder {
  protected tokenizer: any;
  public maxTokens: number;
  protected numLayers: number;
  protected topK: number;
  protected threshold: number;
  protected selectionMode: 'top_k' | 'threshold';
  protected summarizationLength: number;
  protected summarizationModel: BaseSummarizationModel;
  protected embeddingModels: Map<string, BaseEmbeddingModel>;
  protected clusterEmbeddingModel: string;

  constructor(config: TreeBuilderConfig) {
    this.tokenizer = config.tokenizer;
    this.maxTokens = config.maxTokens;
    this.numLayers = config.numLayers;
    this.topK = config.topK;
    this.threshold = config.threshold;
    this.selectionMode = config.selectionMode;
    this.summarizationLength = config.summarizationLength;
    this.summarizationModel = config.summarizationModel;
    this.embeddingModels = config.embeddingModels;
    this.clusterEmbeddingModel = config.clusterEmbeddingModel;
  }

  async createNode(
    index: number,
    text: string,
    childrenIndices?: Set<number>
  ): Promise<[number, Node]> {
    const children = childrenIndices || new Set<number>();
    const embeddings: Embeddings = {};
    
    for (const [modelName, model] of this.embeddingModels.entries()) {
      embeddings[modelName] = await model.createEmbedding(text);
    }
    
    return [index, new Node(text, index, children, embeddings)];
  }

  async summarize(context: string, maxTokens: number = 150): Promise<string> {
    return this.summarizationModel.summarize(context, maxTokens);
  }

  async buildFromText(text: string): Promise<Tree> {
    const chunks = splitText(text, this.tokenizer, this.maxTokens);
    console.log('Creating Leaf Nodes');
    
    const leafNodes = new Map<number, Node>();
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (chunk) {  // Ensure chunk is defined
        const [index, node] = await this.createNode(i, chunk);
        leafNodes.set(index, node);
      }
    }
    
    const layerToNodes = new Map<number, Node[]>();
    layerToNodes.set(0, Array.from(leafNodes.values()));
    
    console.log(`Created ${leafNodes.size} Leaf Embeddings`);
    console.log('Building All Nodes');
    
    const allNodes = new Map(leafNodes);
    const rootNodes = await this.constructTree(allNodes, allNodes, layerToNodes);
    
    return new Tree(allNodes, rootNodes, leafNodes, this.numLayers, layerToNodes);
  }

  abstract constructTree(
    currentLevelNodes: Map<number, Node>,
    allTreeNodes: Map<number, Node>,
    layerToNodes: Map<number, Node[]>
  ): Promise<Map<number, Node>>;
}

---

**Path**: src/tree_retriever.ts

**Content**:
import { encoding_for_model } from 'tiktoken';
import { Node, Tree } from './tree_structures';
import { BaseEmbeddingModel, OpenAIEmbeddingModel } from './models';
import {
  reverseMapping,
  getNodeList,
  getEmbeddings,
  getText,
  distancesFromEmbeddings,
  indicesOfNearestNeighborsFromDistances
} from './utils';

export class TreeRetrieverConfig {
  tokenizer: any;
  threshold: number;
  topK: number;
  selectionMode: 'top_k' | 'threshold';
  contextEmbeddingModel: string;
  embeddingModel: BaseEmbeddingModel;
  numLayers: number | undefined;
  startLayer: number | undefined;

  constructor(params: Partial<TreeRetrieverConfig> = {}) {
    this.tokenizer = params.tokenizer || encoding_for_model('gpt-3.5-turbo');
    this.threshold = params.threshold || 0.5;
    this.topK = params.topK || 5;
    this.selectionMode = params.selectionMode || 'top_k';
    this.contextEmbeddingModel = params.contextEmbeddingModel || 'OpenAI';
    this.embeddingModel = params.embeddingModel || new OpenAIEmbeddingModel();
    this.numLayers = params.numLayers;
    this.startLayer = params.startLayer;
  }
}

export class TreeRetriever {
  private tree: Tree;
  private numLayers: number;
  private startLayer: number;
  private tokenizer: any;
  private topK: number;
  private threshold: number;
  private selectionMode: 'top_k' | 'threshold';
  private embeddingModel: BaseEmbeddingModel;
  private contextEmbeddingModel: string;
  private treeNodeIndexToLayer: Map<number, number>;

  constructor(config: TreeRetrieverConfig, tree: Tree) {
    this.tree = tree;
    this.numLayers = config.numLayers !== undefined ? config.numLayers : tree.numLayers + 1;
    this.startLayer = config.startLayer !== undefined ? config.startLayer : tree.numLayers;
    this.tokenizer = config.tokenizer;
    this.topK = config.topK;
    this.threshold = config.threshold;
    this.selectionMode = config.selectionMode;
    this.embeddingModel = config.embeddingModel;
    this.contextEmbeddingModel = config.contextEmbeddingModel;
    this.treeNodeIndexToLayer = reverseMapping(tree.layerToNodes);
  }

  async createEmbedding(text: string): Promise<number[]> {
    return this.embeddingModel.createEmbedding(text);
  }

  async retrieveInformationCollapseTree(
    query: string,
    topK: number,
    maxTokens: number
  ): Promise<[Node[], string]> {
    const queryEmbedding = await this.createEmbedding(query);
    const selectedNodes: Node[] = [];
    const nodeList = getNodeList(this.tree.allNodes);
    const embeddings = getEmbeddings(nodeList, this.contextEmbeddingModel);
    const distances = distancesFromEmbeddings(queryEmbedding, embeddings);
    const indices = indicesOfNearestNeighborsFromDistances(distances);
    
    let totalTokens = 0;
    for (const idx of indices.slice(0, topK)) {
      const node = nodeList[idx];
      if (!node) continue; // Skip if node is undefined
      
      const nodeTokens = this.tokenizer.encode(node.text).length;
      
      if (totalTokens + nodeTokens > maxTokens) break;
      
      selectedNodes.push(node);
      totalTokens += nodeTokens;
    }
    
    const context = getText(selectedNodes);
    return [selectedNodes, context];
  }

  // Overloaded method signatures
  async retrieve(query: string): Promise<string>;
  async retrieve(
    query: string,
    startLayer?: number,
    numLayers?: number,
    topK?: number,
    maxTokens?: number,
    collapseTree?: boolean,
    returnLayerInformation?: false
  ): Promise<string>;
  async retrieve(
    query: string,
    startLayer?: number,
    numLayers?: number,
    topK?: number,
    maxTokens?: number,
    collapseTree?: boolean,
    returnLayerInformation?: true
  ): Promise<[string, any[]]>;
  async retrieve(
    query: string,
    startLayer?: number,
    numLayers?: number,
    topK: number = 10,
    maxTokens: number = 3500,
    collapseTree: boolean = true,
    returnLayerInformation: boolean = false
  ): Promise<string | [string, any[]]> {
    startLayer = startLayer ?? this.startLayer;
    numLayers = numLayers ?? this.numLayers;
    
    let selectedNodes: Node[];
    let context: string;
    
    if (collapseTree) {
      console.log('Using collapsed_tree');
      [selectedNodes, context] = await this.retrieveInformationCollapseTree(query, topK, maxTokens);
    } else {
      const layerNodes = this.tree.layerToNodes.get(startLayer);
      if (!layerNodes) {
        throw new Error(`No nodes found for layer ${startLayer}`);
      }
      [selectedNodes, context] = await this.retrieveInformation(layerNodes, query, numLayers);
    }
    
    if (returnLayerInformation) {
      const layerInformation = selectedNodes.map(node => ({
        node_index: node.index,
        layer_number: this.treeNodeIndexToLayer.get(node.index),
      }));
      return [context, layerInformation];
    }
    
    return context;
  }

  private async retrieveInformation(
    currentNodes: Node[],
    query: string,
    numLayers: number
  ): Promise<[Node[], string]> {
    const queryEmbedding = await this.createEmbedding(query);
    const selectedNodes: Node[] = [];
    let nodeList = currentNodes;
    
    for (let layer = 0; layer < numLayers; layer++) {
      const embeddings = getEmbeddings(nodeList, this.contextEmbeddingModel);
      const distances = distancesFromEmbeddings(queryEmbedding, embeddings);
      const indices = indicesOfNearestNeighborsFromDistances(distances);
      
      let bestIndices: number[];
      if (this.selectionMode === 'threshold') {
        bestIndices = indices.filter(index => distances[index] > this.threshold);
      } else {
        bestIndices = indices.slice(0, this.topK);
      }
      
      const nodesToAdd = bestIndices.map(idx => nodeList[idx]).filter(node => node !== undefined) as Node[];
      selectedNodes.push(...nodesToAdd);
      
      if (layer !== numLayers - 1) {
        const childNodes = new Set<number>();
        for (const idx of bestIndices) {
          const node = nodeList[idx];
          if (node) {
            node.children.forEach(child => childNodes.add(child));
          }
        }
        nodeList = Array.from(childNodes)
          .map(i => this.tree.allNodes.get(i))
          .filter(node => node !== undefined) as Node[];
      }
    }
    
    const context = getText(selectedNodes);
    return [selectedNodes, context];
  }
}

---

**Path**: src/tree_structures.ts

**Content**:
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

---

**Path**: src/utils.ts

**Content**:
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

---

