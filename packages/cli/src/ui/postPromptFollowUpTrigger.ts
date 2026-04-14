/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Heuristic: should the optional post-prompt 3-phase skill pipeline run after this
 * user message? Intended for **implementation / new-capability** requests, not Q&A,
 * thanks, or casual chat.
 */
export function isLikelyNewFeatureOrImplementationRequest(
  text: string,
): boolean {
  const t = text.trim();
  if (t.length < 16) {
    return false;
  }

  const lower = t.toLowerCase();

  // Pure acknowledgements / minimal replies
  if (
    /^(thanks|thank you|ok\.?|okay|got it|nice|cool|yep|nope|yes\.?|no\.?)\s*$/i.test(
      t,
    )
  ) {
    return false;
  }

  // Obvious read-only questions without build verbs (short-circuit false)
  if (
    /^(what|why|when|where|who|which)\s+(is|are|was|were|does|do|did|would|will)\b/i.test(
      t,
    ) &&
    !/\b(add|implement|create|build|make|new\s+feature|feature\s+request)\b/i.test(
      t,
    )
  ) {
    return false;
  }

  if (
    /^how\s+(does|do|is|are|can|could|would)\b/i.test(t) &&
    !/\b(add|implement|create|build|make|i\s+add|to\s+add)\b/i.test(t)
  ) {
    return false;
  }

  if (/^(explain|describe|define|list|summarize|summarise)\b/i.test(t)) {
    return false;
  }

  // Positive: implementation / new capability language
  if (
    /\b(add|adding|implement|implementation|create|creating|build|building|introduce|introducing|scaffold|scaffolding)\b/i.test(
      lower,
    )
  ) {
    return true;
  }

  if (/\bnew\s+feature|feature\s+request|enhancement\b/i.test(lower)) {
    return true;
  }

  if (
    /\b(extend|extending|wire\s+up|integrate|integrating|add\s+support|build\s+out)\b/i.test(
      lower,
    )
  ) {
    return true;
  }

  if (
    /\b(please|can\s+you|could\s+you|i\s+need|we\s+need)\s+(to\s+)?(add|implement|create|build|make|have)\b/i.test(
      t,
    )
  ) {
    return true;
  }

  if (
    /\b(make|making)\s+(a|an|the)\s+(new|command|component|api|endpoint|flag|option|skill|feature)\b/i.test(
      t,
    )
  ) {
    return true;
  }

  return false;
}
