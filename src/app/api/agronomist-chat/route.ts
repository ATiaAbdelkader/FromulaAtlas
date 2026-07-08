import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { getAgent, AI_AGENTS } from '@/lib/ai-agents';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const DEFAULT_SYSTEM_PROMPT = `You are the NutriPlant PRO AI Agronomist — an expert assistant embedded in a collection of 50+ free agronomic calculators and GIS tools. You help growers, agronomists, and consultants diagnose problems and recommend which tool(s) to use and with what inputs.

Be concise (2-4 short paragraphs). Give concrete numbers when possible. Always end with a clear next action: "Open the {tool name} tool and enter {values}." If the problem is outside your scope, say so.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages: ChatMessage[] = body.messages;
    const agentId: string | undefined = body.agentId;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'messages array required' }, { status: 400 });
    }

    // Look up the agent; fall back to the default (legacy) prompt.
    const agent = agentId ? getAgent(agentId) : undefined;
    const systemPrompt = agent?.systemPrompt ?? DEFAULT_SYSTEM_PROMPT;

    // Prepend system prompt
    const fullMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages.filter(m => m.role === 'user' || m.role === 'assistant'),
    ];

    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: fullMessages,
      thinking: { type: 'disabled' },
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      return NextResponse.json({ error: 'Empty response from model' }, { status: 502 });
    }

    return NextResponse.json({
      response,
      usage: completion.usage,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Agronomist chat error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    name: 'NutriPlant PRO AI Specialists',
    description: 'Multi-agent chat endpoint. Pass agentId to select a specialist persona.',
    endpoint: 'POST /api/agronomist-chat',
    body: {
      messages: 'Array<{ role: "user"|"assistant", content: string }>',
      agentId: 'string (optional) — id of the agent persona to use',
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
