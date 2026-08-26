import { NextRequest, NextResponse } from 'next/server';
import {
  AiProviderNotConfiguredError,
  createAiCompletion,
  isProviderConfigured,
} from '@/lib/ai-completion';
import { getAgent, AI_AGENTS, getLocalizedAgentDisplay } from '@/lib/ai-agents';
import {
  buildAgentGovernance,
  buildAgentSystemPrompt,
  normalizeAgentLanguage,
  sanitizeAgentWorkspaceContext,
} from '@/lib/ai-agent-orchestrator';
import {
  AI_MAX_MESSAGES,
  AI_MAX_MESSAGE_CHARS,
  consumeAiRateLimit,
  getClientKey,
  parseGovernedChatMessages,
  publicAiError,
} from '@/lib/ai-governance';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const limit = consumeAiRateLimit(getClientKey(req));
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many AI requests. Please wait before trying again.', retryAfterSeconds: limit.retryAfterSeconds },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
    );
  }

  let language: 'en' | 'fr' | 'ar' = 'en';

  try {
    const body = await req.json();
    const governed = parseGovernedChatMessages(body?.messages);
    if (!governed.ok) {
      return NextResponse.json({ error: governed.error }, { status: 400 });
    }

    language = normalizeAgentLanguage(body?.language);
    const requestedAgentId = typeof body?.agentId === 'string' ? body.agentId : 'agronomist';
    const agent = getAgent(requestedAgentId) ?? getAgent('agronomist');
    const workspaceContext = sanitizeAgentWorkspaceContext(body?.workspaceContext);
    const fullMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      {
        role: 'system',
        content: buildAgentSystemPrompt({ language, agent, workspaceContext }),
      },
      ...governed.messages,
    ];

    if (!isProviderConfigured()) {
      const configurationError = new AiProviderNotConfiguredError();
      return NextResponse.json(
        {
          error: publicAiError(configurationError, language),
          code: configurationError.code,
        },
        { status: 503 },
      );
    }

    const completion = await createAiCompletion(fullMessages);

    const response = completion.choices[0]?.message?.content;
    if (!response || typeof response !== 'string') {
      return NextResponse.json({ error: 'The AI returned no usable response. Please retry.' }, { status: 502 });
    }

    return NextResponse.json({
      response: response.trim().slice(0, 12_000),
      usage: completion.usage,
      governance: {
        historyMessages: Math.min(governed.messages.length, AI_MAX_MESSAGES),
        messageLimit: AI_MAX_MESSAGE_CHARS,
        ...buildAgentGovernance(language, Boolean(workspaceContext)),
      },
      agent: agent ? {
        id: agent.id,
        ...getLocalizedAgentDisplay(agent, language),
      } : undefined,
    });
  } catch (error) {
    console.error('Agronomist chat error:', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ error: publicAiError(error, language) }, { status: 503 });
  }
}

export async function GET() {
  return NextResponse.json({
    name: 'NutriPlant PRO AI Specialists',
    description: 'Multi-agent chat endpoint with bounded history, rate limiting, and advisory-only responses.',
    endpoint: 'POST /api/agronomist-chat',
    body: {
      messages: 'Array<{ role: "user"|"assistant", content: string }>',
      agentId: 'string (optional) — id of the agent persona to use; defaults to agronomist',
      language: '"en" | "fr" | "ar" (optional; defaults to English)',
      workspaceContext: 'Optional compact active-farm, portfolio, weather, and request-focus context',
    },
    providerConfigured: isProviderConfigured(),
    governance: {
      maxMessages: AI_MAX_MESSAGES,
      maxMessageCharacters: AI_MAX_MESSAGE_CHARS,
      rateLimit: '20 requests per minute per client key',
      advisoryOnly: true,
      supportedLanguages: ['en', 'fr', 'ar'],
      workspaceContext: 'Sanitized optional user-visible context only',
    },
    agents: AI_AGENTS.map(a => ({
      id: a.id,
      name: a.name,
      emoji: a.emoji,
      description: a.description,
      category: a.category,
    })),
  });
}
