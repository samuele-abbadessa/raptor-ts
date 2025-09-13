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