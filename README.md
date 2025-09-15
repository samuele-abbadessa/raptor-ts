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