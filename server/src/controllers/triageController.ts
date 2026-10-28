import { Request, Response } from 'express';

// Strict list of non-medical indicators
const NON_MEDICAL_PATTERNS = [
  /\b(write|code|program|python|javascript|typescript|react|html|css|sql|function|algorithm|bug|debug)\b/i,
  /\b(president|election|politics|government|democrat|republican|parliament|minister)\b/i,
  /\b(recipe|bake|cook|movie|cinema|actor|actress|song|lyrics|album|game|videogame)\b/i,
  /\b(crypto|bitcoin|ethereum|stock|invest|finance|forex|loan|mortgage)\b/i,
  /\b(poem|story|novel|essay|homework|joke|riddle|math|equation|calculate)\b/i,
];

// Health and medical indicators
const MEDICAL_INDICATORS = [
  /\b(pain|ache|fever|cough|cold|headache|rash|throat|stomach|nausea|vomit|dizzy|fatigue|swelling)\b/i,
  /\b(chest|heart|breath|bleed|cut|wound|burn|fracture|bone|muscle|joint|blood|pressure|glucose)\b/i,
  /\b(medicine|medication|drug|pill|dose|tablet|antibiotic|allergy|allergic|vaccine|infection)\b/i,
  /\b(doctor|clinic|hospital|emergency|ems|ambulance|nurse|surgeon|specialist|consult)\b/i,
  /\b(travel|malaria|dengue|water|typhoid|yellow fever|zika|altitude|jetlag)\b/i,
  /\b(symptom|illness|disease|condition|diagnosis|treatment|therapy|health|vital)\b/i,
];

const GUARDRAIL_REFUSAL_MESSAGE =
  `🛡️ **Medical Guardrail Notice**\n\n` +
  `I am **MediBot**, an AI clinical health and medical triage assistant. ` +
  `Under strict safety guidelines, I am restricted to answering questions regarding **human health, physical symptoms, medications, medical conditions, and travel health advisories**.\n\n` +
  `I cannot answer questions about programming, politics, entertainment, finance, or general non-medical topics.\n\n` +
  `Please ask a health-related question or describe any symptoms you are experiencing.`;

// Call Google Gemini API with system guardrails
async function callGeminiTriage(apiKey: string, userQuery: string) {
  const models = process.env.GEMINI_MODELS
    ? process.env.GEMINI_MODELS.split(',').map(m => m.trim())
    : [process.env.GEMINI_MODEL || 'gemini-3.5-flash'];
  let lastError: any = null;

  const systemPrompt = `You are MediBot, an empathetic, certified AI Clinical Triage Assistant for MediConnect.
CRITICAL SAFETY & GUARDRAIL RULES:
1. ONLY answer medical, symptom, medication, wellness, and travel health questions.
2. If the user asks about ANY non-medical topic (e.g. coding, programming, math, politics, movies, cooking, crypto, general conversation), you MUST decline immediately with: "${GUARDRAIL_REFUSAL_MESSAGE}"
3. If it is a medical query, perform clinical triage and categorize urgency as:
   - "critical": life-threatening (e.g. severe chest pain, stroke signs, difficulty breathing, massive hemorrhage) -> set shouldCallEmergency = true.
   - "high": needs urgent attention within hours.
   - "moderate": non-emergency, virtual consultation recommended within 24h.
   - "low": self-limiting, mild discomfort.
4. Output MUST be valid JSON conforming to this schema without markdown fences:
{
  "severity": "low" | "moderate" | "high" | "critical",
  "recommendation": "string",
  "suggestedSpecialty": "string",
  "shouldCallEmergency": boolean,
  "botReply": "string"
}`;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemPrompt}\n\nPatient Query: "${userQuery}"` }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 800,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`[${model}] error (${response.status}): ${errorText.slice(0, 150)}`);
      }

      const json: any = await response.json();
      const parts = json.candidates?.[0]?.content?.parts;
      const textContent = parts?.find((p: any) => p.text && !p.thought)?.text || parts?.[0]?.text;
      if (!textContent) {
        throw new Error(`Empty response from [${model}]`);
      }

      const cleanJson = textContent.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (err: any) {
      lastError = err;
      console.warn(`[triageController] ${model} attempt failed: ${err.message}`);
    }
  }

  throw lastError || new Error('All active Gemini models failed triage query.');
}

// POST /api/triage/assess
export const assessSymptoms = async (req: Request, res: Response) => {
  try {
    const { symptoms, message } = req.body;
    const input = (symptoms || message || '').trim();

    if (!input) {
      return res.status(400).json({ success: false, message: 'Please describe your symptoms' });
    }

    // 1. Guardrail Check: Reject obvious non-medical topics
    const isNonMedical = NON_MEDICAL_PATTERNS.some(pattern => pattern.test(input));
    const hasMedicalKeywords = MEDICAL_INDICATORS.some(pattern => pattern.test(input));

    if (isNonMedical && !hasMedicalKeywords) {
      return res.json({
        success: true,
        data: {
          severity: 'low',
          recommendation: 'Non-medical query blocked by safety guardrails. Please ask a clinical or health question.',
          suggestedSpecialty: 'General Health Only',
          shouldCallEmergency: false,
          isGuardrailBlocked: true,
          botReply: GUARDRAIL_REFUSAL_MESSAGE,
        },
      });
    }

    // 2. Check if a custom AI API key is provided
    const apiKey =
      (req.headers['x-ai-api-key'] as string) ||
      (req.body.apiKey as string) ||
      process.env.GEMINI_API_KEY ||
      process.env.AI_API_KEY;

    if (apiKey && apiKey.trim().length > 10) {
      try {
        const aiResult = await callGeminiTriage(apiKey.trim(), input);
        return res.json({
          success: true,
          data: {
            ...aiResult,
            source: 'gemini-ai-model',
          },
        });
      } catch (aiErr: any) {
        console.warn('[MediBot AI] Gemini API call notice, falling back to clinical rule engine:', aiErr.message);
        // Fall back gracefully to rule-based clinical engine
      }
    }

    // 3. Clinical Rule Engine Fallback
    const lowerInput = input.toLowerCase();
    let severity: 'low' | 'moderate' | 'high' | 'critical' = 'low';
    let recommendation = 'Your symptoms appear mild. Rest, hydration, and monitoring are advised.';
    let suggestedSpecialty = 'General Care';
    let shouldCallEmergency = false;

    if (
      lowerInput.includes('chest pain') ||
      lowerInput.includes('breathing') ||
      lowerInput.includes('unconscious') ||
      lowerInput.includes('severe bleeding') ||
      lowerInput.includes('heart')
    ) {
      severity = 'critical';
      recommendation = 'CRITICAL: Severe symptoms detected. Please dial emergency EMS services (e.g. 911 / 112) or head to the nearest Emergency Room immediately.';
      suggestedSpecialty = 'Cardiology / Emergency Care';
      shouldCallEmergency = true;
    } else if (
      lowerInput.includes('high fever') ||
      lowerInput.includes('fracture') ||
      lowerInput.includes('vomiting') ||
      lowerInput.includes('severe pain')
    ) {
      severity = 'high';
      recommendation = 'Urgent medical attention recommended. Please book an urgent video consultation or visit an urgent care clinic today.';
      suggestedSpecialty = 'Emergency / Internal Medicine';
    } else if (
      lowerInput.includes('fever') ||
      lowerInput.includes('cough') ||
      lowerInput.includes('rash') ||
      lowerInput.includes('headache')
    ) {
      severity = 'moderate';
      recommendation = 'Moderate symptoms detected. A virtual consultation with a certified doctor is recommended within 24 hours.';
      suggestedSpecialty = lowerInput.includes('rash') ? 'Dermatology' : 'General Care';
    }

    return res.json({
      success: true,
      data: {
        severity,
        recommendation,
        suggestedSpecialty,
        shouldCallEmergency,
        source: 'clinical-rule-engine',
        botReply: shouldCallEmergency
          ? `🚨 **CRITICAL EMERGENCY ALERT**\n\nBased on your described symptoms, this requires IMMEDIATE medical emergency attention.\n\nPlease tap the **Call Emergency** button below to connect with local first responders, or proceed to the nearest emergency room immediately.`
          : `Thank you for sharing your symptoms. Based on clinical triage guidelines, your urgency level is **${severity.toUpperCase()}**.\n\n**Recommendation**: ${recommendation}\n\n**Suggested Specialty**: **${suggestedSpecialty}**.\n\n*Disclaimer: MediBot provides preliminary triage guidance and is not a substitute for formal clinical diagnosis.*`,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Triage service failed' });
  }
};
