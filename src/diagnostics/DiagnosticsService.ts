import { MODULE_ID } from "@/constants";
import { Logger } from "@/diagnostics/Logger";
import { createDropletError } from "@/dropbox/errors";
import type { FoundryAdapter } from "@/foundry/FoundryAdapter";
import type {
  DiagnosticRecord,
  DropletErrorCode,
  DropletErrorOptions,
} from "@/types/errors";

interface RuntimeSnapshot {
  readonly moduleId: string;
  readonly foundryVersion: string;
  readonly foundryGeneration: number;
  readonly userId: string;
  readonly userRole: number;
  readonly isGamemaster: boolean;
}

export class DiagnosticsService {
  private readonly logger = new Logger();
  private readonly records: DiagnosticRecord[] = [];
  private started = false;

  public constructor(private readonly adapter: FoundryAdapter) {}

  public start(): void {
    if (this.started) {
      return;
    }

    this.started = true;
    this.logger.info("Diagnostics initialized", this.snapshot());
  }

  public recordCode(code: DropletErrorCode, options: DropletErrorOptions = {}): DiagnosticRecord {
    const error = createDropletError(code, options);
    return this.record(error);
  }

  public record(error: Error & DiagnosticRecordLike): DiagnosticRecord {
    const record: DiagnosticRecord = {
      code: error.code,
      message: error.message,
      technicalDetail: error.technicalDetail,
      timestamp: Date.now(),
    };

    this.records.push(record);
    this.logger.warn(error.message, record.technicalDetail);
    return record;
  }

  public getRecords(): readonly DiagnosticRecord[] {
    return [...this.records];
  }

  public snapshot(): RuntimeSnapshot {
    return {
      moduleId: MODULE_ID,
      foundryVersion: this.adapter.version,
      foundryGeneration: this.adapter.generation,
      userId: this.adapter.currentUserId(),
      userRole: this.adapter.currentUserRole(),
      isGamemaster: this.adapter.isGamemaster(),
    };
  }
}

interface DiagnosticRecordLike {
  readonly code: DropletErrorCode;
  readonly technicalDetail: string;
}