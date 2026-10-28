import { Request, Response } from 'express';
import { AIAgentService } from '../services/aiAgentService';
import { getDbPool } from '../config/db';

export const translateTextAI = async (req: Request, res: Response) => {
  try {
    const { text, targetLang, category } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide text to translate' });
    }

    const apiKey = (req.headers['x-ai-api-key'] as string) || req.body.apiKey;
    const result = await AIAgentService.translateAndSavePhrase(
      text.trim(),
      targetLang || 'es',
      category || 'emergency',
      apiKey
    );

    return res.json({
      success: true,
      message: 'Medical translation generated and saved to Neon DB',
      data: result,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'AI translation failed' });
  }
};

export const harvestPhrasesBatchAI = async (req: Request, res: Response) => {
  try {
    const apiKey = (req.headers['x-ai-api-key'] as string) || req.body.apiKey;
    const result = await AIAgentService.harvestMedicalPhrasesBatch(apiKey);
    return res.json({
      success: true,
      message: `Successfully harvested ${result.count} clinical phrases into Neon DB`,
      data: result,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'AI phrase harvest failed' });
  }
};

export const harvestDestinationAI = async (req: Request, res: Response) => {
  try {
    const { countryCode } = req.body;
    if (!countryCode) {
      return res.status(400).json({ success: false, message: 'Please provide countryCode (e.g. JP, FR, IN)' });
    }
    const apiKey = (req.headers['x-ai-api-key'] as string) || req.body.apiKey;
    const result = await AIAgentService.harvestDestinationIntelligence(countryCode, apiKey);
    return res.json({
      success: true,
      message: `Harvested travel EMS & health advisory for ${result.name} into Neon DB`,
      data: result,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'AI destination harvest failed' });
  }
};

export const harvestMedicinesBatchAI = async (req: Request, res: Response) => {
  try {
    const apiKey = (req.headers['x-ai-api-key'] as string) || req.body.apiKey;
    const count = await AIAgentService.harvestMedicineEquivalentsBatch(apiKey);
    return res.json({
      success: true,
      message: `Harvested ${count} international medicine equivalents into Neon DB`,
      count,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'AI medicine harvest failed' });
  }
};

export const generateMedicineAI = async (req: Request, res: Response) => {
  try {
    const { medicineName } = req.body;
    if (!medicineName) {
      return res.status(400).json({ success: false, message: 'Please provide medicineName (e.g. Paracetamol, Metformin)' });
    }
    const apiKey = (req.headers['x-ai-api-key'] as string) || req.body.apiKey;
    const result = await AIAgentService.generateMedicineEquivalent(medicineName, apiKey);
    return res.json({
      success: true,
      message: `Generated international brand equivalents for ${result.genericName}`,
      data: result,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'AI medicine generation failed' });
  }
};

export const getAIStatus = async (_req: Request, res: Response) => {
  try {
    const pool = getDbPool();
    let phraseCount = 0;
    let destCount = 0;
    let medCount = 0;

    if (pool) {
      const [pRes, dRes, mRes] = await Promise.all([
        pool.query('SELECT COUNT(*) FROM medical_phrases'),
        pool.query('SELECT COUNT(*) FROM travel_destinations'),
        pool.query('SELECT COUNT(*) FROM medicine_equivalents'),
      ]);
      phraseCount = parseInt(pRes.rows[0].count, 10);
      destCount = parseInt(dRes.rows[0].count, 10);
      medCount = parseInt(mRes.rows[0].count, 10);
    }

    return res.json({
      success: true,
      service: 'MediConnect AI Agent Harvester & Translation Engine',
      hasGeminiApiKey: Boolean(process.env.GEMINI_API_KEY || process.env.AI_API_KEY),
      databaseSync: {
        totalPhrasesInDb: phraseCount,
        totalDestinationsInDb: destCount,
        totalMedicineEquivalentsInDb: medCount,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Error checking AI agent status' });
  }
};
