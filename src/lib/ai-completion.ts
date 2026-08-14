import ZAI from 'z-ai-web-dev-sdk';

type ChatRole = 'system' | 'user' | 'assistant';

export interface AiChatMessage {
  role: ChatRole;
  content: string;
}

export interface AiCompletionResult {
  choices: Array<{ message?: { content?: string | null } }>;
  usage?: unknown;
  provider: 'openai-compatible' | 'zai';
  model?: string;
}

const DEFAULT_MODEL = 'gpt-5-mini';
const REQUEST_TIMEOUT_MS = 45_000;

function hasOpenAiCompatibleConfig() {
  return Boolean(process.env.OPENAI_API_BASE && process.env.OPENAI_API_KEY);
}

function getOpenAiEndpoint() {
  return `${process.env.OPENAI_API_BASE!.replace(/\/$/, '')}/chat/completions`;
}

async function completeWithOpenAiCompatible(messages: AiChatMessage[]): Promise<AiCompletionResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const model = process.env.FORMULA_ATLAS_LLM_MODEL || DEFAULT_MODEL;
    const response = await fetch(getOpenAiEndpoint(), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        max_completion_tokens: 2_000,
      }),
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const providerMessage = typeof payload?.error?.message === 'string' ? payload.error.message : `HTTP ${response.status}`;
      throw new Error(`OpenAI-compatible provider error: ${providerMessage}`);
    }

    return {
      choices: Array.isArray(payload?.choices) ? payload.choices : [],
      usage: payload?.usage,
      provider: 'openai-compatible',
      model,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function completeWithZai(messages: AiChatMessage[]): Promise<AiCompletionResult> {
  const zai = await ZAI.create();
  const completion = await zai.chat.completions.create({
    messages,
    thinking: { type: 'disabled' },
  });
  return {
    choices: completion.choices,
    usage: completion.usage,
    provider: 'zai',
  };
}

/**
 * Prefer the platform's OpenAI-compatible server runtime so local and deployed
 * environments do not require a user-home `.z-ai-config` file. ZAI remains a
 * compatibility fallback for existing FormulaAtlas deployments that still
 * provide that configuration.
 */
export async function createAiCompletion(messages: AiChatMessage[]): Promise<AiCompletionResult> {
  if (hasOpenAiCompatibleConfig()) {
    return completeWithOpenAiCompatible(messages);
  }
  return completeWithZai(messages);
}
