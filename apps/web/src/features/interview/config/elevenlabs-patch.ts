/**
 * Monkey-patch for @elevenlabs/client SDK bug:
 * handleErrorEvent crashes with "Cannot read properties of undefined (reading 'error_type')"
 * when the server sends a { type: "error" } message without the expected error_event property.
 *
 * This patches VoiceConversation (and its parent BaseConversation) to guard against
 * undefined error_event before accessing its fields.
 */

import { VoiceConversation, Conversation } from "@elevenlabs/client";

let patched = false;

export function patchElevenLabsErrorHandler() {
  if (patched) return;
  patched = true;

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
