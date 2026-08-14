'use client';

import { AgriAgentChatFloating } from './AgriAgentChat';

/**
 * Backward-compatible entry point for the original floating Agronomist button.
 * It now opens the multilingual, context-aware FormulaAtlas agent experience
 * instead of maintaining a second, narrower chat implementation.
 */
export function AgronomistAssistant() {
  return <AgriAgentChatFloating />;
}
