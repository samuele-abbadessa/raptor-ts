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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
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
exports.RetrievalAugmentationConfig = exports.RetrievalAugmentation = exports.RAPTORClustering = exports.TreeRetrieverConfig = exports.TreeRetriever = exports.ClusterTreeConfig = exports.ClusterTreeBuilder = exports.TreeBuilderConfig = exports.TreeBuilder = exports.GPT3QAModel = exports.GPT4QAModel = exports.GPT3TurboQAModel = exports.GPT3SummarizationModel = exports.GPT3TurboSummarizationModel = exports.SBertEmbeddingModel = exports.OpenAIEmbeddingModel = exports.BaseRetriever = exports.BaseQAModel = exports.BaseSummarizationModel = exports.BaseEmbeddingModel = exports.Tree = exports.Node = void 0;
exports.example = example;
var tree_structures_1 = require("./tree_structures");
Object.defineProperty(exports, "Node", { enumerable: true, get: function () { return tree_structures_1.Node; } });
Object.defineProperty(exports, "Tree", { enumerable: true, get: function () { return tree_structures_1.Tree; } });
var models_1 = require("./models");
Object.defineProperty(exports, "BaseEmbeddingModel", { enumerable: true, get: function () { return models_1.BaseEmbeddingModel; } });
Object.defineProperty(exports, "BaseSummarizationModel", { enumerable: true, get: function () { return models_1.BaseSummarizationModel; } });
Object.defineProperty(exports, "BaseQAModel", { enumerable: true, get: function () { return models_1.BaseQAModel; } });
Object.defineProperty(exports, "BaseRetriever", { enumerable: true, get: function () { return models_1.BaseRetriever; } });
Object.defineProperty(exports, "OpenAIEmbeddingModel", { enumerable: true, get: function () { return models_1.OpenAIEmbeddingModel; } });
Object.defineProperty(exports, "SBertEmbeddingModel", { enumerable: true, get: function () { return models_1.SBertEmbeddingModel; } });
Object.defineProperty(exports, "GPT3TurboSummarizationModel", { enumerable: true, get: function () { return models_1.GPT3TurboSummarizationModel; } });
Object.defineProperty(exports, "GPT3SummarizationModel", { enumerable: true, get: function () { return models_1.GPT3SummarizationModel; } });
Object.defineProperty(exports, "GPT3TurboQAModel", { enumerable: true, get: function () { return models_1.GPT3TurboQAModel; } });
Object.defineProperty(exports, "GPT4QAModel", { enumerable: true, get: function () { return models_1.GPT4QAModel; } });
Object.defineProperty(exports, "GPT3QAModel", { enumerable: true, get: function () { return models_1.GPT3QAModel; } });
var tree_builder_1 = require("./tree_builder");
Object.defineProperty(exports, "TreeBuilder", { enumerable: true, get: function () { return tree_builder_1.TreeBuilder; } });
Object.defineProperty(exports, "TreeBuilderConfig", { enumerable: true, get: function () { return tree_builder_1.TreeBuilderConfig; } });
var cluster_tree_builder_1 = require("./cluster_tree_builder");
Object.defineProperty(exports, "ClusterTreeBuilder", { enumerable: true, get: function () { return cluster_tree_builder_1.ClusterTreeBuilder; } });
Object.defineProperty(exports, "ClusterTreeConfig", { enumerable: true, get: function () { return cluster_tree_builder_1.ClusterTreeConfig; } });
var tree_retriever_1 = require("./tree_retriever");
Object.defineProperty(exports, "TreeRetriever", { enumerable: true, get: function () { return tree_retriever_1.TreeRetriever; } });
Object.defineProperty(exports, "TreeRetrieverConfig", { enumerable: true, get: function () { return tree_retriever_1.TreeRetrieverConfig; } });
var clustering_1 = require("./clustering");
Object.defineProperty(exports, "RAPTORClustering", { enumerable: true, get: function () { return clustering_1.RAPTORClustering; } });
var retrieval_augmentation_1 = require("./retrieval_augmentation");
Object.defineProperty(exports, "RetrievalAugmentation", { enumerable: true, get: function () { return retrieval_augmentation_1.RetrievalAugmentation; } });
Object.defineProperty(exports, "RetrievalAugmentationConfig", { enumerable: true, get: function () { return retrieval_augmentation_1.RetrievalAugmentationConfig; } });
__exportStar(require("./utils"), exports);
// Example usage function
async function example() {
    // Import the main class
    const { RetrievalAugmentation } = await Promise.resolve().then(() => __importStar(require('./retrieval_augmentation')));
    // Set your OpenAI API key
    process.env.OPENAI_API_KEY = 'your-openai-api-key';
    // Initialize RAPTOR
    const ra = new RetrievalAugmentation();
    // Add documents
    const text = "Your document text here...";
    await ra.addDocuments(text);
    // Answer questions
    const answer = await ra.answerQuestion("Your question here?");
    console.log("Answer:", answer);
    // Save the tree
    ra.save("./my_tree.json");
}
example().catch(console.error);
//# sourceMappingURL=index.js.map