import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { getAgent, AI_AGENTS } from '@/lib/ai-agents';
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

const DEFAULT_SYSTEM_PROMPT = `You are the NutriPlant PRO AI Agronomist — an expert assistant embedded in a collection of 50+ free agronomic calculators and GIS tools. You help growers, agronomists, and consultants diagnose problems and recommend which tool(s) to use and with what inputs.

Be concise (2-4 short paragraphs). Give concrete numbers when possible. Always end with a clear next action: "Open the {tool name} tool and enter {values}." If the problem is outside your scope, say so.

Safety and uncertainty rules:
- Treat your response as educational decision support, not a substitute for local agronomist, extension, or product-label advice.
- State assumptions and uncertainty when data is incomplete; never invent lab values, weather, product labels, or legal use instructions.
- For pesticide or fertilizer actions, direct the grower to verify the local label, crop registration, rate, pre-harvest interval, and re-entry interval before acting.
- Prefer integrated pest management and measurement before recommending an intervention.`;

export async function POST(req: NextRequest) {
  const limit = consumeAiRateLimit(getClientKey(req));
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many AI requests. Please wait before trying again.', retryAfterSeconds: limit.retryAfterSeconds },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
    );
  }

  try {
    const body = await req.json();
    const governed = parseGovernedChatMessages(body?.messages);
    if (!governed.ok) {
      return NextResponse.json({ error: governed.error }, { status: 400 });
    }

    const agentId = typeof body?.agentId === 'string' ? body.agentId : undefined;
    const agent = agentId ? getAgent(agentId) : undefined;
    const systemPrompt = agent?.systemPrompt ?? DEFAULT_SYSTEM_PROMPT;
    const fullMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
      ...governed.messages,
    ];

    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: fullMessages,
      thinking: { type: 'disabled' },
    });

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
        advisoryOnly: true,
      },
    });
  } catch (error) {
    console.error('Agronomist chat error:', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ error: publicAiError(error) }, { status: 503 });
  }
}

export async function GET() {
  return NextResponse.json({
    name: 'NutriPlant PRO AI Specialists',
    description: 'Multi-agent chat endpoint with bounded history, rate limiting, and advisory-only responses.',
    endpoint: 'POST /api/agronomist-chat',
    body: {
      messages: 'Array<{ role: "user"|"assistant", content: string }>',
      agentId: 'string (optional) — id of the agent persona to use',
    },
    governance: {
      maxMessages: AI_MAX_MESSAGES,
      maxMessageCharacters: AI_MAX_MESSAGE_CHARS,
      rateLimit: '20 requests per minute per client key',
      advisoryOnly: true,
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
