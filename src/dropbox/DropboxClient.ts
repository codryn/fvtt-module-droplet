export interface ListFolderArgs {
  readonly path: string;
  readonly limit: number;
}

export interface ThumbnailRequest {
  readonly path: string;
  readonly size: "w128h128";
  readonly format: "jpeg";
  readonly mode: "strict";
}

export interface AccountSummary {
  readonly accountId: string;
  readonly email: string;
  readonly displayName: string;
}

export interface SharedLinkMetadata {
  readonly url: string;
  readonly id: string | null;
  readonly pathLower: string | null;
  readonly name: string | null;
}

export interface CreateSharedLinkOutcome {
  readonly link: SharedLinkMetadata;
  readonly created: boolean;
}

export interface ThumbnailResult {
  readonly path: string;
  readonly metadataTag: "success" | "failure";
  readonly thumbnail: string | null;
}

export interface EntryMetadata {
  readonly tag: "file" | "folder";
  readonly id: string;
  readonly name: string;
  readonly pathDisplay: string;
  readonly pathLower: string;
  readonly rev: string | null;
  readonly size: number | null;
  readonly clientModified: string | null;
}

export interface ListFolderResult {
  readonly entries: readonly EntryMetadata[];
  readonly cursor: string | null;
  readonly hasMore: boolean;
}

export interface DropboxClient {
  listFolder(args: ListFolderArgs, signal?: AbortSignal): Promise<ListFolderResult>;
  listFolderContinue(cursor: string, signal?: AbortSignal): Promise<ListFolderResult>;
  getMetadata(path: string, signal?: AbortSignal): Promise<EntryMetadata>;
  getThumbnailBatch(entries: readonly ThumbnailRequest[], signal?: AbortSignal): Promise<readonly ThumbnailResult[]>;
  listSharedLinks(path: string, signal?: AbortSignal): Promise<readonly SharedLinkMetadata[]>;
  createSharedLink(path: string, signal?: AbortSignal): Promise<CreateSharedLinkOutcome>;
  getCurrentAccount(signal?: AbortSignal): Promise<AccountSummary>;
  revokeToken(signal?: AbortSignal): Promise<void>;
}