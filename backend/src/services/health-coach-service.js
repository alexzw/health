import { env } from "../config/env.js";
import { buildHealthCoachPlan } from "../lib/health-coach.js";

function buildAiPrompt(member, plan, growth, lang) {
  return `
You are a cautious family health coach. You are not a doctor and must not diagnose.
Explain the member's health data in plain language, aligned to their goal.
Focus on trend interpretation, practical weekly actions, and when to seek professional advice.
Never prescribe medication, never claim certainty, and avoid alarming language.
Write the response in ${lang === "en" ? "English" : "Traditional Chinese"}.

Return valid JSON with this shape:
{
  "overview": "string",
  "whyItMatters": "string",
  "nextFocus": ["string", "string", "string"],
  "careNote": "string"
}

Member:
${JSON.stringify(
    {
      id: member.id,
      name: member.name,
      familyRole: member.familyRole,
      goal: plan.goal,
      metrics: plan.metrics,
      observations: plan.observations,
      actions: plan.actions,
      watchouts: plan.watchouts,
      growthSummary: growth?.summary || null
    },
    null,
    2
  )}
`;
}

async function generateAiSummary(member, plan, growth, lang) {
  if (!env.openAiApiKey) {
    return null;
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.openAiApiKey}`
    },
    body: JSON.stringify({
      model: env.openAiModel,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a careful health coach for a private family dashboard. You explain trends, not diagnoses."
        },
        {
          role: "user",
          content: buildAiPrompt(member, plan, growth, lang)
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${errorText}`);
  }

  const payload = await response.json();
  const content = payload.choices?.[0]?.message?.content;

  if (!content) {
    return null;
  }

  return JSON.parse(content);
}

export class HealthCoachService {
  constructor(familyMemberService) {
    this.familyMemberService = familyMemberService;
  }

  async getCoachInsights(id, lang = "zh") {
    const member = await this.familyMemberService.getFamilyMember(id);

    if (!member) {
      return null;
    }

    const growth = member.familyRole === "Child" ? await this.familyMemberService.getGrowthTracking(id) : null;
    const plan = buildHealthCoachPlan(member, growth, lang);

    let aiSummary = null;
    let aiError = "";

    try {
      aiSummary = await generateAiSummary(member, plan, growth, lang);
    } catch (error) {
      aiError = error.message;
    }

    return {
      member: {
        id: member.id,
        name: member.name,
        familyRole: member.familyRole
      },
      ...plan,
      ai: {
        enabled: Boolean(env.openAiApiKey),
        model: env.openAiApiKey ? env.openAiModel : "",
        summary: aiSummary,
        error: aiError
      }
    };
  }
}
