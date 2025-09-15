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