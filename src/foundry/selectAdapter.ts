import type { FoundryAdapter } from "@/foundry/FoundryAdapter";
import { UnsupportedVersionAdapter } from "@/foundry/UnsupportedVersionAdapter";
import { FoundryV13Adapter } from "@/foundry/v13/FoundryV13Adapter";
import { FoundryV14Adapter } from "@/foundry/v14/FoundryV14Adapter";

function detectFoundryGeneration(): number {
  const reportedGeneration = game.release?.generation;

  if (typeof reportedGeneration === "number") {
    return reportedGeneration;
  }

  const majorVersion = Number.parseInt(game.version?.split(".")[0] ?? "0", 10);
  return Number.isFinite(majorVersion) ? majorVersion : 0;
}

export function selectAdapter(): FoundryAdapter {
  const version = game.version ?? "unknown";
  const generation = detectFoundryGeneration();

  if (generation >= 14) {
    return generation === 14
      ? new FoundryV14Adapter(version)
      : new UnsupportedVersionAdapter(14, version);
  }

  if (generation === 13) {
    return new FoundryV13Adapter(version);
  }

  return new UnsupportedVersionAdapter(13, version);
}
