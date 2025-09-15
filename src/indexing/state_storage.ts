// src/indexing/state_storage.ts

import * as fs from 'fs/promises';
import * as path from 'path';
import { IndexingState } from './types';

export interface IndexingStateStorage {
  save(state: IndexingState): Promise<void>;
  load(id: string): Promise<IndexingState | null>;
  list(): Promise<IndexingState[]>;
  delete(id: string): Promise<void>;
}

export class FileSystemIndexingStateStorage implements IndexingStateStorage {
  private basePath: string;
  
  constructor(storagePath: string = './indexing_states') {
    this.basePath = storagePath;
  }

  private async initialize(): Promise<void> {
    await fs.mkdir(this.basePath, { recursive: true });
  }

  async save(state: IndexingState): Promise<void> {
    await this.initialize();
    const filePath = path.join(this.basePath, `${state.id}.json`);
    
    // Convert dates to ISO strings for serialization
    const serializable = {
      ...state,
      createdAt: state.createdAt.toISOString(),
      lastUpdatedAt: state.lastUpdatedAt.toISOString()
    };
    
    await fs.writeFile(filePath, JSON.stringify(serializable, null, 2));
  }

  async load(id: string): Promise<IndexingState | null> {
    try {
      const filePath = path.join(this.basePath, `${id}.json`);
      const data = await fs.readFile(filePath, 'utf-8');
      const parsed = JSON.parse(data);
      
      // Convert ISO strings back to Date objects
      return {
        ...parsed,
        createdAt: new Date(parsed.createdAt),
        lastUpdatedAt: new Date(parsed.lastUpdatedAt)
      };
    } catch {
      return null;
    }
  }

  async list(): Promise<IndexingState[]> {
    await this.initialize();
    
    try {
      const files = await fs.readdir(this.basePath);
      const states = await Promise.all(
        files
          .filter(f => f.endsWith('.json'))
          .map(f => this.load(f.replace('.json', '')))
      );
      return states.filter((s): s is IndexingState => s !== null);
    } catch {
      return [];
    }
  }

  async delete(id: string): Promise<void> {
    const filePath = path.join(this.basePath, `${id}.json`);
    await fs.unlink(filePath).catch(() => {});
  }
}