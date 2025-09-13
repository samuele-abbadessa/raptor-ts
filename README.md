# 🦖 RAPTOR-TS

A TypeScript implementation of RAPTOR (Recursive Abstractive Processing for Tree-Organized Retrieval), originally created by **Parth Sarthi** ([@parthsarthi03](https://github.com/parthsarthi03)).

This is a complete TypeScript port of the [original Python implementation](https://github.com/parthsarthi03/raptor), bringing the power of recursive document processing and tree-organized retrieval to the JavaScript/TypeScript ecosystem.

## 📋 Overview

RAPTOR introduces a novel approach to retrieval-augmented language models by constructing a recursive tree structure from documents. This allows for more efficient and context-aware information retrieval across large texts, addressing common limitations in traditional language models.

### Key Features

- 🌳 **Recursive Tree Construction**: Build hierarchical document representations
- 📝 **Multi-level Summarization**: Create summaries at different abstraction levels
- 🔍 **Intelligent Retrieval**: Query documents with context-aware search
- 🔧 **Extensible Architecture**: Easily swap embedding, summarization, and QA models
- 💾 **TypeScript Native**: Full type safety and modern JavaScript features

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

### Advanced Configuration

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

## 🎯 Use Cases

RAPTOR-TS is perfect for:

- **Document Q&A Systems**: Build intelligent document search and question-answering systems
- **Knowledge Base Management**: Organize and query large knowledge bases efficiently
- **Research Tools**: Analyze and extract insights from academic papers or reports
- **Content Summarization**: Generate multi-level summaries of long documents
- **RAG Applications**: Enhance retrieval-augmented generation with hierarchical context

## 📚 API Reference

### Main Classes

#### `RetrievalAugmentation`
The main orchestrator class for document processing and retrieval.

```typescript
const ra = new RetrievalAugmentation(config?, tree?);
await ra.addDocuments(text: string);
await ra.answerQuestion(question: string, options?);
await ra.retrieve(question: string, options?);
ra.save(path: string);
```

#### `RetrievalAugmentationConfig`
Configuration class for customizing RAPTOR behavior.

```typescript
new RetrievalAugmentationConfig({
  treeBuilderConfig?: TreeBuilderConfig,
  treeRetrieverConfig?: TreeRetrieverConfig,
  qaModel?: BaseQAModel,
  treeBuilderType?: string
});
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

## 🔗 Links

- [NPM Package](https://www.npmjs.com/package/raptor-ts)
- [Original Python Implementation](https://github.com/parthsarthi03/raptor)
- [Research Paper](https://arxiv.org/abs/2401.18059)
- [Documentation](https://github.com/samuele-abbadessa/raptor-ts)