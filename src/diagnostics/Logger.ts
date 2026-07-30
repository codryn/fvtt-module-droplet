import { MODULE_ID } from "@/constants";
import { redactValue } from "@/diagnostics/Redactor";

type LogLevel = "debug" | "info" | "warn" | "error";

function formatLogMessage(message: string, details: readonly unknown[]): string {
  const suffix = details.length === 0 ? "" : ` ${details.map((detail) => redactValue(detail)).join(" ")}`;
  return `[${MODULE_ID}] ${message}${suffix}`;
}

export class Logger {
  public debug(message: string, ...details: readonly unknown[]): void {
    this.write("debug", message, details);
  }

  public info(message: string, ...details: readonly unknown[]): void {
    this.write("info", message, details);
  }

  public warn(message: string, ...details: readonly unknown[]): void {
    this.write("warn", message, details);
  }

  public error(message: string, ...details: readonly unknown[]): void {
    this.write("error", message, details);
  }

  private write(level: LogLevel, message: string, details: readonly unknown[]): void {
    const formattedMessage = formatLogMessage(message, details);

    switch (level) {
      case "debug":
        console.debug(formattedMessage);
        return;
      case "info":
        console.info(formattedMessage);
        return;
      case "warn":
        console.warn(formattedMessage);
        return;
      case "error":
        console.error(formattedMessage);
        return;
    }
  }
}