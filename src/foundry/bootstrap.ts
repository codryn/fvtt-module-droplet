import { HOOKS } from "@/constants";
import { DiagnosticsService } from "@/diagnostics/DiagnosticsService";
import type { FoundryAdapter } from "@/foundry/FoundryAdapter";
import { selectAdapter } from "@/foundry/selectAdapter";
import { registerSettings, validateRegisteredSettings } from "@/settings/registerSettings";

let adapterInstance: FoundryAdapter | null = null;
let diagnosticsInstance: DiagnosticsService | null = null;
let bootstrapRegistered = false;

export function getFoundryAdapter(): FoundryAdapter {
  if (!adapterInstance) {
    throw new Error("Droplet bootstrap has not run yet.");
  }

  return adapterInstance;
}

export function getDiagnosticsService(): DiagnosticsService {
  if (!diagnosticsInstance) {
    throw new Error("Droplet diagnostics have not been initialized yet.");
  }

  return diagnosticsInstance;
}

export function registerBootstrap(): void {
  if (bootstrapRegistered) {
    return;
  }

  bootstrapRegistered = true;

  Hooks.once("init", () => {
    adapterInstance = selectAdapter();
    diagnosticsInstance = new DiagnosticsService(adapterInstance);

    registerSettings(adapterInstance);

    adapterInstance.onReady(() => {
      const adapter = getFoundryAdapter();
      const diagnostics = getDiagnosticsService();

      if (!adapter.supported) {
        diagnostics.recordCode("UnsupportedFoundryVersion", {
          detail: `Foundry generation ${adapter.generation} (${adapter.version}) is outside Droplet's supported matrix.`,
        });
        adapter.notify("warn", adapter.localize("DROPLET.errors.UnsupportedFoundryVersion.message"));
        return;
      }

      validateRegisteredSettings(adapter);
      diagnostics.start();
      Hooks.callAll(HOOKS.ready, { generation: adapter.generation, version: adapter.version });
    });
  });
}