import { obsidianTestConnection, obsidianListPipelineFiles, obsidianSync } from './db';
import type { ConnectionResult, ObsidianFile, SyncResult } from '../types';

export async function testConnection(apiUrl: string, apiKey: string): Promise<ConnectionResult> {
  return obsidianTestConnection(apiUrl, apiKey);
}

export async function listPipelineFiles(apiUrl: string, apiKey: string, folder: string): Promise<ObsidianFile[]> {
  return obsidianListPipelineFiles(apiUrl, apiKey, folder);
}

export async function syncVault(actor: string): Promise<SyncResult> {
  return obsidianSync(actor);
}
