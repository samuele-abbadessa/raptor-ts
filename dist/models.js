"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GPT3QAModel = exports.GPT4QAModel = exports.GPT3TurboQAModel = exports.GPT3SummarizationModel = exports.GPT3TurboSummarizationModel = exports.SBertEmbeddingModel = exports.OpenAIEmbeddingModel = exports.BaseRetriever = exports.BaseQAModel = exports.BaseSummarizationModel = exports.BaseEmbeddingModel = void 0;
const openai_1 = require("openai");
const transformers_1 = require("@xenova/transformers");
// ============= Base Models =============
class BaseEmbeddingModel {
}
exports.BaseEmbeddingModel = BaseEmbeddingModel;
class BaseSummarizationModel {
}
exports.BaseSummarizationModel = BaseSummarizationModel;
class BaseQAModel {
}
exports.BaseQAModel = BaseQAModel;
class BaseRetriever {
}
exports.BaseRetriever = BaseRetriever;
// ============= Embedding Models =============
class OpenAIEmbeddingModel extends BaseEmbeddingModel {
    constructor(model = 'text-embedding-ada-002') {
        super();
        this.model = model;
        this.client = new openai_1.OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    async createEmbedding(text) {
        const cleanText = text.replace(/\n/g, ' ');
        const response = await this.client.embeddings.create({
            input: [cleanText],
            model: this.model,
        });
        return response.data[0].embedding;
    }
}
exports.OpenAIEmbeddingModel = OpenAIEmbeddingModel;
class SBertEmbeddingModel extends BaseEmbeddingModel {
    constructor(modelName = 'sentence-transformers/all-MiniLM-L6-v2') {
        super();
        this.modelName = modelName;
        this.initialized = false;
    }
    async initialize() {
        if (!this.initialized) {
            this.model = await (0, transformers_1.pipeline)('feature-extraction', this.modelName);
            this.initialized = true;
        }
    }
    async createEmbedding(text) {
        await this.initialize();
        const output = await this.model(text, { pooling: 'mean', normalize: true });
        return Array.from(output.data);
    }
}
exports.SBertEmbeddingModel = SBertEmbeddingModel;
// ============= Summarization Models =============
class GPT3TurboSummarizationModel extends BaseSummarizationModel {
    constructor(model = 'gpt-3.5-turbo') {
        super();
        this.model = model;
        this.client = new openai_1.OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    async summarize(context, maxTokens = 500) {
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
        }
        catch (error) {
            console.error(error);
            return '';
        }
    }
}
exports.GPT3TurboSummarizationModel = GPT3TurboSummarizationModel;
class GPT3SummarizationModel extends BaseSummarizationModel {
    constructor(model = 'text-davinci-003') {
        super();
        this.model = model;
        this.client = new openai_1.OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    async summarize(context, maxTokens = 500) {
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
        }
        catch (error) {
            console.error(error);
            return '';
        }
    }
}
exports.GPT3SummarizationModel = GPT3SummarizationModel;
// ============= QA Models =============
class GPT3TurboQAModel extends BaseQAModel {
    constructor(model = 'gpt-3.5-turbo') {
        super();
        this.model = model;
        this.client = new openai_1.OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    async answerQuestion(context, question) {
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
        }
        catch (error) {
            console.error(error);
            return String(error);
        }
    }
}
exports.GPT3TurboQAModel = GPT3TurboQAModel;
class GPT4QAModel extends BaseQAModel {
    constructor(model = 'gpt-4') {
        super();
        this.model = model;
        this.client = new openai_1.OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    async answerQuestion(context, question) {
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
        }
        catch (error) {
            console.error(error);
            return String(error);
        }
    }
}
exports.GPT4QAModel = GPT4QAModel;
class GPT3QAModel extends BaseQAModel {
    constructor(model = 'text-davinci-003') {
        super();
        this.model = model;
        this.client = new openai_1.OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    async answerQuestion(context, question, maxTokens = 150) {
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
        }
        catch (error) {
            console.error(error);
            return '';
        }
    }
}
exports.GPT3QAModel = GPT3QAModel;
//# sourceMappingURL=models.js.map