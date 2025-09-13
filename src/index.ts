export { Node, Tree, Embeddings } from './tree_structures';
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
  RetrievalAugmentationConfig 
} from './retrieval_augmentation';
export * from './utils';

// Example usage function
export async function example() {
  // Import the main class
  const { RetrievalAugmentation } = await import('./retrieval_augmentation');
  
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