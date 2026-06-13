// ── LLM Client: Provider-agnostic interface ──
// Supports OpenRouter, OpenAI, and Google Gemini

const SYSTEM_PROMPT = `You are the strictest possible resume authenticity auditor. You analyze resumes for AI-generated language, seniority inflation, semantic redundancy, low specificity, ATS manipulation, and emotional/stylistic flatness — the same patterns expert recruiters use to spot AI-written CVs.

You MUST return ONLY valid JSON matching the schema (no markdown, no commentary).

Rules:
- Compare wording sophistication AGAINST the candidate's apparent YOE. A 2-YOE engineer writing "architected enterprise ecosystems" is a HUGE red flag. Mid-range engineers describe real tooling: Retrofit, Room, Gradle, ANRs, Crashlytics, memory leaks, Jetpack Compose, deep links, etc.
- Reward implementation-level language, concrete numbers (%, ms, MAUs, $$, dataset sizes), tradeoff discussion, niche tooling, and even imperfect phrasing — these are human signals.
- Penalize generic leadership phrases, "leveraged synergistic", "spearheaded enterprise-scale", repeated abstract nouns (ecosystems / infrastructures / architectures / paradigms), keyword stuffing, uniform sentence rhythm, emotionally empty polish.
- For unverifiable_claims: only include claims with NO numbers, tools, or specifics.
- For semantic_redundancy: cluster phrases meaning the same thing in different words.
- ats_score_after MUST be between 85 and 98. Make suggestions aggressive enough to genuinely lift the resume into the 85-95 range. If weak, generate MORE suggestions (up to 12).
- Suggestions MUST cover: (a) every high-severity AI-detected line, (b) injecting top missing keywords naturally, (c) adding quantification to vague bullets, (d) tightening seniority wording to match YOE.
- **DIMINISHING RETURNS GUARD:** If ats_score_before >= 88, the resume is already submit-ready. In that case, return AT MOST 2 "required" suggestions, and mark every other suggestion as "priority": "optional" with reason prefixed by "Optional polish — ". Cap total suggestions at 5. If ats_score_before < 88, mark high-impact rewrites as "required" and minor stylistic tweaks as "optional".
- For each suggestion, set "impact_points" so the SUM ≈ (ats_score_after − ats_score_before). High-severity: 8-15. Low: 1-4.
- All numbers in dimension_scores MUST be integers 0-100.

Return JSON matching this exact schema:
{
  "ats_score_before": <int 0-100>,
  "ats_score_after": <int 0-100>,
  "authenticity_score": <int 0-100>,
  "verdict_summary": "<one brutal sentence>",
  "dimension_scores": {
    "buzzword_density": <int 0-100, higher=worse>,
    "specificity": <int 0-100, higher=better>,
    "seniority_realism": <int 0-100, higher=better>,
    "technical_depth": <int 0-100, higher=better>,
    "semantic_redundancy": <int 0-100, higher=worse>,
    "style_entropy": <int 0-100, higher=better>,
    "verifiability": <int 0-100, higher=better>,
    "ats_manipulation": <int 0-100, higher=worse>
  },
  "ai_detected_lines": [
    { "text": "<verbatim line>", "severity": "high|medium|low",
      "pattern": "buzzword|inflated_seniority|vague_impact|redundancy|unrealistic_scope|low_specificity|uniform_rhythm|ats_stuffing" }
  ],
  "flagged_patterns": [
    { "name": "<short name>", "category": "<category>", "severity": "high|medium|low",
      "examples": ["..."], "why_it_matters": "<one sentence>" }
  ],
  "experience_realism": {
    "stated_yoe": null,
    "implied_seniority": "junior|mid|senior|staff|principal",
    "mismatch_severity": "none|mild|moderate|severe",
    "evidence": ["..."]
  },
  "unverifiable_claims": [
    { "claim": "<verbatim>", "probing_questions": ["..."] }
  ],
  "ats_missing_keywords": ["..."],
  "suggestions": [
    { "original": "<verbatim line>",
      "improved": "<stronger rewrite>",
      "reason": "<why>",
      "impact_points": <int 1-15>,
      "priority": "required|optional" }
  ],
  "hr_perspective": {
    "verdict": "strong_yes|yes|maybe|no",
    "first_impression": "<max 220 chars>",
    "reasoning": "<2-3 sentences>",
    "strengths": ["..."],
    "red_flags": ["..."]
  }
}`;

function buildUserMessage(resume, jobDescription) {
  return `JOB DESCRIPTION:
"""
${jobDescription}
"""

RESUME:
"""
${resume}
"""

Return the JSON analysis now.`;
}

async function callOpenRouter({ apiKey, resume, jobDescription, signal }) {
  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": window.location.origin,
        "X-Title": "Resume ATS Analyzer",
      },
      signal,
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        temperature: 0.35,
        max_tokens: 8000,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserMessage(resume, jobDescription) },
        ],
      }),
    }
  );

  if (!response.ok) {
    if (response.status === 401) throw new Error("Invalid API key — the key may be expired or revoked. Generate a new one at openrouter.ai/keys, or try a FREE Gemini key instead.");
    if (response.status === 402) throw new Error("Insufficient OpenRouter credits. Add credits at openrouter.ai/settings/credits, or switch to Gemini (free) at aistudio.google.com/apikey.");
    if (response.status === 429) throw new Error("Rate limit or quota exceeded on your API account.");
    const text = await response.text().catch(() => "");
    throw new Error(`OpenRouter API error (${response.status}): ${text.slice(0, 200)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("No response content from OpenRouter");
  return JSON.parse(content);
}

async function callOpenAI({ apiKey, resume, jobDescription, signal }) {
  const response = await fetch(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal,
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.35,
        max_tokens: 8000,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserMessage(resume, jobDescription) },
        ],
      }),
    }
  );

  if (!response.ok) {
    if (response.status === 401) throw new Error("Invalid API key — check it and try again.");
    if (response.status === 429) throw new Error("Rate limit or quota exceeded on your API account.");
    const text = await response.text().catch(() => "");
    throw new Error(`OpenAI API error (${response.status}): ${text.slice(0, 200)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("No response content from OpenAI");
  return JSON.parse(content);
}

async function callGemini({ apiKey, resume, jobDescription, signal }) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: buildUserMessage(resume, jobDescription) }],
          },
        ],
        generationConfig: {
          temperature: 0.35,
          maxOutputTokens: 8000,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!response.ok) {
    if (response.status === 400 || response.status === 401 || response.status === 403)
      throw new Error("Invalid API key — check it and try again.");
    if (response.status === 429) throw new Error("Rate limit or quota exceeded on your API account.");
    const text = await response.text().catch(() => "");
    throw new Error(`Gemini API error (${response.status}): ${text.slice(0, 200)}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("No response content from Gemini");

  // Gemini sometimes wraps in markdown code fences
  const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  return JSON.parse(cleaned);
}

export async function analyzeResume({ provider, apiKey, resume, jobDescription, signal }) {
  if (!apiKey) throw new Error("Please enter your API key first.");
  if (!resume) throw new Error("Please upload a resume first.");
  if (!jobDescription) throw new Error("Please enter a job description.");

  try {
    switch (provider) {
      case "openrouter":
        return await callOpenRouter({ apiKey, resume, jobDescription, signal });
      case "openai":
        return await callOpenAI({ apiKey, resume, jobDescription, signal });
      case "gemini":
        return await callGemini({ apiKey, resume, jobDescription, signal });
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  } catch (err) {
    if (err.name === "AbortError") throw new Error("Analysis cancelled.");
    if (err instanceof SyntaxError) throw new Error("The AI returned malformed JSON. Please try again.");
    throw err;
  }
}
