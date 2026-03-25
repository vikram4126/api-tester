import Dexie, { type EntityTable } from 'dexie';

export interface Workspace {
  id: string;
  name: string;
  createdAt: number;
}

export interface Environment {
  id: string;
  workspaceId: string;
  name: string;
  variables: Record<string, string>;
}

export interface Collection {
  id: string;
  workspaceId: string;
  parentId: string | null;
  name: string;
}

export interface RequestItem {
  id: string;
  collectionId: string;
  name: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  params: Record<string, string>;
  body: {
    type: 'none' | 'json' | 'form-data' | 'raw';
    content: string;
  };
  preRequestScript?: string;
}

export interface HistoryItem {
  id: string;
  requestId: string | null;
  method: string;
  url: string;
  status: number;
  statusText: string;
  time: number;
  size: number;
  timestamp: number;
}

const db = new Dexie('SmartRequestEngineDB') as Dexie & {
  workspaces: EntityTable<Workspace, 'id'>;
  environments: EntityTable<Environment, 'id'>;
  collections: EntityTable<Collection, 'id'>;
  requests: EntityTable<RequestItem, 'id'>;
  history: EntityTable<HistoryItem, 'id'>;
};

db.version(1).stores({
  workspaces: 'id, createdAt',
  environments: 'id, workspaceId',
  collections: 'id, workspaceId, parentId',
  requests: 'id, collectionId',
  history: 'id, requestId, timestamp'
});

export { db };
