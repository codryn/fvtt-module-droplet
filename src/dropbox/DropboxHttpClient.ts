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
import { createDropletError, mapDropboxError } from "@/dropbox/errors";
import { createRateLimitDelayMs, waitForDelay } from "@/dropbox/rateLimit";
import type { Logger } from "@/diagnostics/Logger";

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
      const entriesPayload = Array.isArray(payload.entries) ? payload.entries : [];
      return entriesPayload.map((entry) => ({
        path: typeof entry.metadata?.path_lower === "string" ? entry.metadata.path_lower : "",
        metadataTag: entry[".tag"] === "success" ? "success" : "failure",
        thumbnail: typeof entry.thumbnail === "string" ? entry.thumbnail : null,
      }));
    });
  }

  public async listSharedLinks(path: string, signal?: AbortSignal): Promise<readonly SharedLinkMetadata[]> {
    const payload = await this.requestJson("listSharedLinks", { path, direct_only: true }, signal);
    const links = Array.isArray(payload.links) ? payload.links : [];
    return links.map((link) => this.mapSharedLink(link));
  }

  public async createSharedLink(path: string, signal?: AbortSignal): Promise<CreateSharedLinkOutcome> {
    const payload = await this.requestJson("createSharedLink", { path }, signal);
    return { link: this.mapSharedLink(payload), created: true };
  }

  public async getCurrentAccount(signal?: AbortSignal): Promise<AccountSummary> {
    const payload = await this.requestJson("getCurrentAccount", undefined, signal);
    return {
      accountId: typeof payload.account_id === "string" ? payload.account_id : "",
      email: typeof payload.email === "string" ? payload.email : "",
      displayName: typeof payload.name?.display_name === "string" ? payload.name.display_name : "",
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
  ): Promise<Record<string, any>> {
    const endpoint = DROPBOX_ENDPOINTS[endpointName];
    const accessToken = await this.options.getAccessToken();

    try {
      const response = await this.fetchImpl(`${endpoint.host}${endpoint.path}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
        signal,
      });

      if (response.ok) {
        if (response.status === 204) {
          return {};
        }

        return (await response.json()) as Record<string, any>;
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

      throw mapDropboxError({
        status: response.status,
        endpoint: endpointName,
        errorTag: this.extractErrorTag(errorBody),
        errorSummary: errorBody.error_summary,
        retryAfterMs,
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
      return (await response.json()) as RpcErrorBody;
    }

    const text = await response.text();
    return { error_summary: text };
  }

  private extractErrorTag(errorBody: RpcErrorBody): string | undefined {
    return errorBody.error?.reason?.[".tag"] ?? errorBody.error?.path?.[".tag"] ?? errorBody.error?.[".tag"];
  }

  private mapListFolderResult(payload: Record<string, any>): ListFolderResult {
    const entries = Array.isArray(payload.entries) ? payload.entries.map((entry) => this.mapEntryMetadata(entry)) : [];
    return {
      entries,
      cursor: typeof payload.cursor === "string" ? payload.cursor : null,
      hasMore: payload.has_more === true,
    };
  }

  private mapEntryMetadata(payload: Record<string, any>): EntryMetadata {
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

  private mapSharedLink(payload: Record<string, any>): SharedLinkMetadata {
    return {
      url: typeof payload.url === "string" ? payload.url : "",
      id: typeof payload.id === "string" ? payload.id : null,
      pathLower: typeof payload.path_lower === "string" ? payload.path_lower : null,
      name: typeof payload.name === "string" ? payload.name : null,
    };
  }
}