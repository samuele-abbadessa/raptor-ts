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