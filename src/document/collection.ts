// src/document/collection.ts

import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface DocumentCollection {
  id: string;
  name: string;
  description?: string;
  documentIds: Set<string>;
  metadata: Map<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CollectionStorage {
  createCollection(name: string, description?: string): Promise<string>;
  getCollection(id: string): Promise<DocumentCollection | null>;
  addDocumentsToCollection(collectionId: string, documentIds: string[]): Promise<void>;
  removeDocumentsFromCollection(collectionId: string, documentIds: string[]): Promise<void>;
  listCollections(): Promise<DocumentCollection[]>;
  deleteCollection(id: string): Promise<void>;
}

export class FileSystemCollectionStorage implements CollectionStorage {
  private basePath: string;
  
  constructor(storagePath: string = './document_storage/collections') {
    this.basePath = storagePath;
  }

  private async initialize(): Promise<void> {
    await fs.mkdir(this.basePath, { recursive: true });
  }

  async createCollection(name: string, description?: string): Promise<string> {
    await this.initialize();
    
    const collection: DocumentCollection = {
      id: `col_${uuidv4()}`,
      name,
      description,
      documentIds: new Set(),
      metadata: new Map(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await this.saveCollection(collection);
    return collection.id;
  }

  private async saveCollection(collection: DocumentCollection): Promise<void> {
    const filePath = path.join(this.basePath, `${collection.id}.json`);
    const data = {
      ...collection,
      documentIds: Array.from(collection.documentIds),
      metadata: Array.from(collection.metadata.entries()),
      createdAt: collection.createdAt.toISOString(),
      updatedAt: collection.updatedAt.toISOString()
    };
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  }

  async getCollection(id: string): Promise<DocumentCollection | null> {
    try {
      const filePath = path.join(this.basePath, `${id}.json`);
      const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
      return {
        ...data,
        documentIds: new Set(data.documentIds),
        metadata: new Map(data.metadata),
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt)
      };
    } catch {
      return null;
    }
  }

  async addDocumentsToCollection(
    collectionId: string, 
    documentIds: string[]
  ): Promise<void> {
    const collection = await this.getCollection(collectionId);
    if (!collection) throw new Error(`Collection ${collectionId} not found`);
    
    documentIds.forEach(id => collection.documentIds.add(id));
    collection.updatedAt = new Date();
    
    await this.saveCollection(collection);
  }

  async removeDocumentsFromCollection(
    collectionId: string,
    documentIds: string[]
  ): Promise<void> {
    const collection = await this.getCollection(collectionId);
    if (!collection) throw new Error(`Collection ${collectionId} not found`);
    
    documentIds.forEach(id => collection.documentIds.delete(id));
    collection.updatedAt = new Date();
    
    await this.saveCollection(collection);
  }

  async listCollections(): Promise<DocumentCollection[]> {
    await this.initialize();
    
    try {
      const files = await fs.readdir(this.basePath);
      const collections = await Promise.all(
        files
          .filter(f => f.endsWith('.json'))
          .map(f => this.getCollection(f.replace('.json', '')))
      );
      return collections.filter((c): c is DocumentCollection => c !== null);
    } catch {
      return [];
    }
  }

  async deleteCollection(id: string): Promise<void> {
    const filePath = path.join(this.basePath, `${id}.json`);
    await fs.unlink(filePath).catch(() => {});
  }
}