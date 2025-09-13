export declare abstract class BaseEmbeddingModel {
    abstract createEmbedding(text: string): Promise<number[]>;
}
export declare abstract class BaseSummarizationModel {
    abstract summarize(context: string, maxTokens?: number): Promise<string>;
}
export declare abstract class BaseQAModel {
    abstract answerQuestion(context: string, question: string): Promise<string>;
}
export declare abstract class BaseRetriever {
    abstract retrieve(query: string): Promise<string>;
}
export declare class OpenAIEmbeddingModel extends BaseEmbeddingModel {
    private model;
    private client;
    constructor(model?: string);
    createEmbedding(text: string): Promise<number[]>;
}
export declare class SBertEmbeddingModel extends BaseEmbeddingModel {
    private modelName;
    private model;
    private initialized;
    constructor(modelName?: string);
    private initialize;
    createEmbedding(text: string): Promise<number[]>;
}
export declare class GPT3TurboSummarizationModel extends BaseSummarizationModel {
    private model;
    private client;
    constructor(model?: string);
    summarize(context: string, maxTokens?: number): Promise<string>;
}
export declare class GPT3SummarizationModel extends BaseSummarizationModel {
    private model;
    private client;
    constructor(model?: string);
    summarize(context: string, maxTokens?: number): Promise<string>;
}
export declare class GPT3TurboQAModel extends BaseQAModel {
    private model;
    private client;
    constructor(model?: string);
    answerQuestion(context: string, question: string): Promise<string>;
}
export declare class GPT4QAModel extends BaseQAModel {
    private model;
    private client;
    constructor(model?: string);
    answerQuestion(context: string, question: string): Promise<string>;
}
export declare class GPT3QAModel extends BaseQAModel {
    private model;
    private client;
    constructor(model?: string);
    answerQuestion(context: string, question: string, maxTokens?: number): Promise<string>;
}
//# sourceMappingURL=models.d.ts.map