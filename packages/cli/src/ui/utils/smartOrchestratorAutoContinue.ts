/**
 * Detect when the smart-orchestrator playbook led the model to pause for a
 * human "next" / "continue" — in the automated (Cron) queue there is no human,
 * so the stream layer submits a continuation prompt instead.
 */
export function looksLikeSmartOrchestratorAwaitingUserNext(
  assistantText: string,
): boolean {
  const t = assistantText.trim();
  if (t.length < 8) {
    return false;
  }
  if (/>\s*next\b/i.test(t)) {
    return true;
  }
  if (/\btype\s+[`'"]?next[`'"]?\b/i.test(t)) {
    return true;
  }
  if (/\b(enter|say|reply\s+with)\s+[`'"]?\s*next\b/i.test(t)) {
    return true;
  }
  if (
    /\bwaiting\s+for\s+(your\s+)?(input|reply|response)\b/i.test(t) &&
    /\bnext\b/i.test(t)
  ) {
    return true;
  }
  if (
    /\bmoving\s+to\s+next\s+skill\b/i.test(t) &&
    /\b(next|continue|type)\b/i.test(t)
  ) {
    return true;
  }
  return false;
}

/** Max automatic Cron continuations per smart-orchestrator root run. */
export const SMART_ORCHESTRATOR_AUTO_CONTINUE_CAP = 40;
