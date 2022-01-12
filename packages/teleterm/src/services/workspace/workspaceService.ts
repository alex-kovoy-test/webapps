import path from 'path';
import fs, { readFileSync, existsSync, writeFileSync } from 'fs';
import Logger from 'teleterm/logger';
import { Document } from 'teleterm/ui/services/docs/types';

interface WorkspaceState {
  recentDocuments: Document[];
}

export interface WorkspaceService {
  get(): WorkspaceState;
  update(newWorkspaceState: Partial<WorkspaceState>): void;
}

export function createWorkspaceService(options: {
  dir: string;
}): WorkspaceService {
  const defaultWorkspaceState: WorkspaceState = { recentDocuments: [] };
  const logger = new Logger('Workspace Service');
  const fileName = 'workspace.json';
  const filePath = path.join(options.dir, fileName);
  const workspaceState = readWorkspaceFileSync() || defaultWorkspaceState;

  function get(): WorkspaceState {
    return workspaceState;
  }

  function update(newWorkspaceState: Partial<WorkspaceState>): void {
    Object.assign(workspaceState, newWorkspaceState);
    fs.promises
      .writeFile(filePath, getStringifiedWorkspaceState())
      .catch(error => {
        logger.error(`Cannot update ${fileName} file`, error);
      });
  }

  function readWorkspaceFileSync(): WorkspaceState {
    if (!existsSync(filePath)) {
      try {
        writeFileSync(filePath, getStringifiedWorkspaceState());
      } catch (error) {
        logger.error(`Cannot create ${fileName} file`, error);
        return;
      }
    }

    try {
      return JSON.parse(readFileSync(filePath, { encoding: 'utf-8' }));
    } catch (error) {
      logger.error(`Cannot read ${fileName} file`, error);
    }
  }

  function getStringifiedWorkspaceState(): string {
    return JSON.stringify(workspaceState, null, 2);
  }

  return { get, update };
}
