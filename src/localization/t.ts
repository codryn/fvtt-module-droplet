import type { FoundryAdapter } from "@/foundry/FoundryAdapter";

export function t(
  adapter: FoundryAdapter,
  key: string,
  data?: Record<string, string | number>,
): string {
  return adapter.localize(key, data);
}