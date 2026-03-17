import { env } from "../config/env.js";
import { buildHealthCoachPlan } from "../lib/health-coach.js";

function extractTextFromResponsePayload(payload) {
  if (payload?.output_text) {
    return payload.output_text;
  }

  const outputs = payload?.output || [];

  for (const item of outputs) {
    for (const content of item?.content || []) {
      if (typeof content?.text === "string" && content.text) {
        return content.text;
      }
    }
  }

  return "";
}

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

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.openAiApiKey}`
    },
    body: JSON.stringify({
      model: env.openAiModel,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: "You are a careful health coach for a private family dashboard. You explain trends, not diagnoses."
            }
          ]
        },
        {
          role: "user",
          content: [{ type: "input_text", text: buildAiPrompt(member, plan, growth, lang) }]
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "coach_summary",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              overview: { type: "string" },
              whyItMatters: { type: "string" },
              nextFocus: {
                type: "array",
                items: { type: "string" },
                minItems: 1,
                maxItems: 3
              },
              careNote: { type: "string" }
            },
            required: ["overview", "whyItMatters", "nextFocus", "careNote"]
          }
        }
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${errorText}`);
  }

  const payload = await response.json();
  const content = extractTextFromResponsePayload(payload);

  if (!content) {
    return null;
  }

  return JSON.parse(content);
}

async function generateAiAnswer(member, plan, growth, question, lang) {
  if (!env.openAiApiKey) {
    return {
      answer:
        lang === "en"
          ? `I can still help using your saved trends. Right now, the most relevant focus is: ${plan.weeklyFocus}`
          : `即使未接上 AI，我仍然可以根據現有趨勢幫你解讀。現階段最值得先做的是：${plan.weeklyFocus}`,
      followUp:
        lang === "en"
          ? "Add OPENAI_API_KEY to enable a more detailed personalized answer."
          : "如果之後加入 OPENAI_API_KEY，就可以得到更深入、更加個人化的回答。"
    };
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.openAiApiKey}`
    },
    body: JSON.stringify({
      model: env.openAiModel,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: "You are a careful family health coach. You explain trends and habit suggestions only, never diagnose, and always advise medical review for urgent or concerning symptoms."
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `
Answer the user's question in ${lang === "en" ? "English" : "Traditional Chinese"}.
Return valid JSON with:
{
  "answer": "string",
  "followUp": "string"
}

Question:
${question}

Context:
${JSON.stringify(
            {
              member: {
                id: member.id,
                name: member.name,
                familyRole: member.familyRole
              },
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
`
            }
          ]
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "coach_answer",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              answer: { type: "string" },
              followUp: { type: "string" }
            },
            required: ["answer", "followUp"]
          }
        }
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${errorText}`);
  }

  const payload = await response.json();
  const content = extractTextFromResponsePayload(payload);
  return content ? JSON.parse(content) : null;
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

  async askCoachQuestion(id, question, lang = "zh") {
    const member = await this.familyMemberService.getFamilyMember(id);

    if (!member) {
      return null;
    }

    const growth = member.familyRole === "Child" ? await this.familyMemberService.getGrowthTracking(id) : null;
    const plan = buildHealthCoachPlan(member, growth, lang);
    const reply = await generateAiAnswer(member, plan, growth, question, lang);

    return {
      member: {
        id: member.id,
        name: member.name,
        familyRole: member.familyRole
      },
      question,
      reply,
      aiEnabled: Boolean(env.openAiApiKey),
      model: env.openAiApiKey ? env.openAiModel : ""
    };
  }
}
