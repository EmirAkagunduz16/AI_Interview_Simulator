/**
 * Monkey-patches for @elevenlabs/client SDK quirks:
 *
 * 1. handleErrorEvent crashes with "Cannot read properties of undefined
 *    (reading 'error_type')" when the server sends a { type: "error" } event
 *    without the expected error_event property.
 *
 * 2. The SDK tries to publishData(...) the result of a client tool back to
 *    the agent through livekit-client _after_ we (or the agent itself) have
 *    closed the WebRTC peer connection — surfacing
 *    "UnexpectedConnectionState: PC manager is closed" as an unhandled
 *    rejection. The interview is already ending, so we silently drop this
 *    specific noise instead of letting it pollute the console / error UI.
 */

import { VoiceConversation, Conversation } from "@elevenlabs/client";

let patched = false;

const isClosedPcManagerError = (reason: unknown): boolean => {
  if (!reason) return false;
  const msg =
    reason instanceof Error
      ? `${reason.name}: ${reason.message}`
      : typeof reason === "string"
        ? reason
        : "";
  return /PC manager is closed/i.test(msg) || /UnexpectedConnectionState/i.test(msg);
};

const installClosedPcSuppressor = () => {
  if (typeof window === "undefined") return;

  const handle = (event: PromiseRejectionEvent) => {
    if (isClosedPcManagerError(event.reason)) {
      // Interview is ending; livekit just couldn't deliver the trailing tool
      // response. Swallow it so the user doesn't see a misleading red error.
      event.preventDefault();
      console.debug(
        "[ElevenLabs patch] Suppressed harmless PC-closed rejection:",
        event.reason,
      );
    }
  };

  const errorHandler = (event: ErrorEvent) => {
    if (isClosedPcManagerError(event.error || event.message)) {
      event.preventDefault();
      console.debug(
        "[ElevenLabs patch] Suppressed harmless PC-closed error event:",
        event.message,
      );
    }
  };

  window.addEventListener("unhandledrejection", handle);
  window.addEventListener("error", errorHandler);
};

export function patchElevenLabsErrorHandler() {
  if (patched) return;
  patched = true;

  installClosedPcSuppressor();

  const targets = [VoiceConversation, Conversation].filter(Boolean);

  for (const Cls of targets) {
    const proto = Cls.prototype as unknown as Record<string, unknown>;
    const original = proto.handleErrorEvent as
      | ((event: unknown) => void)
      | undefined;
    if (typeof original !== "function") continue;

    proto.handleErrorEvent = function (
      this: { onError?: (msg: string, ctx?: unknown) => void },
      event: { error_event?: { error_type?: string; message?: string; reason?: string; code?: number; debug_message?: string; details?: unknown }; message?: string; type?: string },
    ) {
      if (!event?.error_event) {
        const msg =
          typeof event?.message === "string"
            ? event.message
            : "Unknown server error (malformed error event)";

        console.warn(
          "[ElevenLabs patch] Received error without error_event:",
          event,
        );

        if (typeof this.onError === "function") {
          this.onError(`Server error: ${msg}`, {
            errorType: "unknown",
            code: undefined,
            debugMessage: JSON.stringify(event),
          });
        }
        return;
      }

      return original.call(this, event);
    };
  }
}
