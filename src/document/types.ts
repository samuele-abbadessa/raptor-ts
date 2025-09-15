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