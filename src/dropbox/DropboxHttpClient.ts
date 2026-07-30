import type {
  AccountSummary,
  CreateSharedLinkOutcome,
  DropboxClient,
  EntryMetadata,
  ListFolderArgs,
  ListFolderResult,
  SharedLinkMetadata,
  ThumbnailRequest,
  ThumbnailResult,
} from "@/dropbox/DropboxClient";
import { DROPBOX_ENDPOINTS, type DropboxEndpointName } from "@/dropbox/endpoints";
import { DropletError, createDropletError, mapDropboxError } from "@/dropbox/errors";
import { createRateLimitDelayMs, waitForDelay } from "@/dropbox/rateLimit";
import type { Logger } from "@/diagnostics/Logger";

type JsonRecord = Record<string, unknown>;

interface DropboxHttpClientOptions {
  readonly getAccessToken: () => Promise<string> | string;
  readonly fetchImpl?: typeof fetch;
  readonly logger?: Logger;
  readonly maxAttempts?: number;
}

interface RpcErrorBody {
  readonly error_summary?: string;
  readonly error?: {
    readonly ".tag"?: string;
    readonly reason?: {
      readonly ".tag"?: string;
    };
    readonly path?: {
      readonly ".tag"?: string;
    };
    readonly retry_after?: number;
  };
}

function asJsonRecord(value: unknown): JsonRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as JsonRecord;
}

function asJsonRecordArray(value: unknown): JsonRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    const record = asJsonRecord(entry);
    return record ? [record] : [];
  });
}

export class DropboxHttpClient implements DropboxClient {
  private readonly fetchImpl: typeof fetch;
  private readonly maxAttempts: number;

  public constructor(private readonly options: DropboxHttpClientOptions) {
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.maxAttempts = options.maxAttempts ?? 3;
  }

  public listFolder(args: ListFolderArgs, signal?: AbortSignal): Promise<ListFolderResult> {
    return this.requestJson("listFolder", { path: args.path, limit: args.limit }, signal).then((payload) =>
      this.mapListFolderResult(payload),
    );
  }

  public listFolderContinue(cursor: string, signal?: AbortSignal): Promise<ListFolderResult> {
    return this.requestJson("listFolderContinue", { cursor }, signal).then((payload) => this.mapListFolderResult(payload));
  }

  public getMetadata(path: string, signal?: AbortSignal): Promise<EntryMetadata> {
    return this.requestJson("getMetadata", { path }, signal).then((payload) => this.mapEntryMetadata(payload));
  }

  public getThumbnailBatch(entries: readonly ThumbnailRequest[], signal?: AbortSignal): Promise<readonly ThumbnailResult[]> {
    return this.requestJson("getThumbnailBatch", { entries }, signal).then((payload) => {
      const entriesPayload = asJsonRecordArray(payload.entries);

      return entriesPayload.map((entry) => ({
        path: (() => {
          const metadata = asJsonRecord(entry.metadata);
          return typeof metadata?.path_lower === "string" ? metadata.path_lower : "";
        })(),
        metadataTag: entry[".tag"] === "success" ? "success" : "failure",
        thumbnail: typeof entry.thumbnail === "string" ? entry.thumbnail : null,
      }));
    });
  }

  public async listSharedLinks(path: string, signal?: AbortSignal): Promise<readonly SharedLinkMetadata[]> {
    const payload = await this.requestJson("listSharedLinks", { path, direct_only: true }, signal);
    const links = asJsonRecordArray(payload.links);
    return links.map((link) => this.mapSharedLink(link));
  }

  public async createSharedLink(path: string, signal?: AbortSignal): Promise<CreateSharedLinkOutcome> {
    const payload = await this.requestJson("createSharedLink", { path }, signal);
    return { link: this.mapSharedLink(payload), created: true };
  }

  public async getCurrentAccount(signal?: AbortSignal): Promise<AccountSummary> {
    const payload = await this.requestJson("getCurrentAccount", undefined, signal);
    const name = asJsonRecord(payload.name);

    return {
      accountId: typeof payload.account_id === "string" ? payload.account_id : "",
      email: typeof payload.email === "string" ? payload.email : "",
      displayName: typeof name?.display_name === "string" ? name.display_name : "",
    };
  }

  public async revokeToken(signal?: AbortSignal): Promise<void> {
    await this.requestJson("revokeToken", undefined, signal);
  }

  private async requestJson(
    endpointName: DropboxEndpointName,
    body: Record<string, unknown> | undefined,
    signal?: AbortSignal,
    attempt = 1,
  ): Promise<JsonRecord> {
    const endpoint = DROPBOX_ENDPOINTS[endpointName];
    const accessToken = await this.options.getAccessToken();
    const requestInit: RequestInit = {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    };

    if (body) {
      requestInit.body = JSON.stringify(body);
    }

    if (signal) {
      requestInit.signal = signal;
    }

    try {
      const response = await this.fetchImpl(`${endpoint.host}${endpoint.path}`, requestInit);

      if (response.ok) {
        if (response.status === 204) {
          return {};
        }

        const payload = asJsonRecord(await response.json());
        return payload ?? {};
      }

      const errorBody = await this.readErrorBody(response);
      const retryAfterMs = createRateLimitDelayMs(
        attempt,
        response.headers.get("Retry-After"),
        errorBody.error?.retry_after,
        this.maxAttempts,
      );

      if (response.status === 429 && retryAfterMs !== null) {
        await waitForDelay(retryAfterMs, signal);
        return this.requestJson(endpointName, body, signal, attempt + 1);
      }

      if (response.status >= 500 && attempt < this.maxAttempts) {
        await waitForDelay(250 * attempt, signal);
        return this.requestJson(endpointName, body, signal, attempt + 1);
      }

      const errorContext = {
        status: response.status,
        endpoint: endpointName,
        retryAfterMs,
      } as const;
      const errorTag = this.extractErrorTag(errorBody);
      const errorSummary = errorBody.error_summary;

      throw mapDropboxError({
        ...errorContext,
        ...(errorTag ? { errorTag } : {}),
        ...(errorSummary ? { errorSummary } : {}),
      });
    } catch (error) {
      if (error instanceof DropletError) {
        throw error;
      }

      if (error instanceof DOMException && error.name === "AbortError") {
        throw createDropletError("Cancelled", { cause: error, detail: "Dropbox request was aborted." });
      }

      this.options.logger?.warn("Dropbox request failed", { endpoint: endpointName, error });
      throw createDropletError("NetworkFailure", {
        cause: error,
        detail: `Dropbox request to ${endpointName} failed before a response was received.`,
      });
    }
  }

  private async readErrorBody(response: Response): Promise<RpcErrorBody> {
    const contentType = response.headers.get("Content-Type") ?? "";

    if (contentType.includes("application/json")) {
      const payload = asJsonRecord(await response.json());
      const error = asJsonRecord(payload?.error);
      const reason = asJsonRecord(error?.reason);
      const path = asJsonRecord(error?.path);
      const errorPayload = error
        ? {
            ...(typeof error[".tag"] === "string" ? { ".tag": error[".tag"] } : {}),
            ...(typeof error.retry_after === "number" ? { retry_after: error.retry_after } : {}),
            ...(reason && typeof reason[".tag"] === "string" ? { reason: { ".tag": reason[".tag"] } } : {}),
            ...(path && typeof path[".tag"] === "string" ? { path: { ".tag": path[".tag"] } } : {}),
          }
        : undefined;

      return {
        ...(typeof payload?.error_summary === "string" ? { error_summary: payload.error_summary } : {}),
        ...(errorPayload ? { error: errorPayload } : {}),
      };
    }

    const text = await response.text();
    return { error_summary: text };
  }

  private extractErrorTag(errorBody: RpcErrorBody): string | undefined {
    return errorBody.error?.reason?.[".tag"] ?? errorBody.error?.path?.[".tag"] ?? errorBody.error?.[".tag"];
  }

  private mapListFolderResult(payload: JsonRecord): ListFolderResult {
    const entries = asJsonRecordArray(payload.entries).map((entry) => this.mapEntryMetadata(entry));
    return {
      entries,
      cursor: typeof payload.cursor === "string" ? payload.cursor : null,
      hasMore: payload.has_more === true,
    };
  }

  private mapEntryMetadata(payload: JsonRecord): EntryMetadata {
    return {
      tag: payload[".tag"] === "folder" ? "folder" : "file",
      id: typeof payload.id === "string" ? payload.id : "",
      name: typeof payload.name === "string" ? payload.name : "",
      pathDisplay: typeof payload.path_display === "string" ? payload.path_display : "",
      pathLower: typeof payload.path_lower === "string" ? payload.path_lower : "",
      rev: typeof payload.rev === "string" ? payload.rev : null,
      size: typeof payload.size === "number" ? payload.size : null,
      clientModified: typeof payload.client_modified === "string" ? payload.client_modified : null,
    };
  }

  private mapSharedLink(payload: JsonRecord): SharedLinkMetadata {
    return {
      url: typeof payload.url === "string" ? payload.url : "",
      id: typeof payload.id === "string" ? payload.id : null,
      pathLower: typeof payload.path_lower === "string" ? payload.path_lower : null,
      name: typeof payload.name === "string" ? payload.name : null,
    };
  }
}