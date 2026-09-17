import axios from 'axios';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { callLLM } from '../routes/ai.routes';

/**
 * Clean LLM output text
 */
function cleanQuizOutput(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\r\n/g, '\n')
    .trim();
}

export interface QuizLLMResponse {
  text: string;
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/**
 * Invokes Groq AI chat completions endpoint.
 */
async function tryGroqCompletion(
  model: string,
  systemPrompt: string,
  userPrompt: string
): Promise<{ text: string; promptTokens: number; completionTokens: number; totalTokens: number } | null> {
  const response = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.6,
      max_tokens: 2500,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.GROQ_API_KEY}`,
      },
      timeout: 25000,
    }
  );

  const text = response.data?.choices?.[0]?.message?.content;
  if (text && text.trim().length > 0) {
    const promptTokens = Number(response.data?.usage?.prompt_tokens || Math.max(1, Math.floor((systemPrompt.length + userPrompt.length) / 4)));
    const completionTokens = Number(response.data?.usage?.completion_tokens || Math.max(1, Math.floor(text.length / 4)));
    const totalTokens = Number(response.data?.usage?.total_tokens || (promptTokens + completionTokens));

    return {
      text: cleanQuizOutput(text),
      promptTokens,
      completionTokens,
      totalTokens,
    };
  }
  return null;
}

/**
 * Specialized LLM invoker EXCLUSIVELY for Quiz & Question Bank Generation.
 *
 * Execution Strategy:
 * 1. Groq AI Primary (e.g. openai/gpt-oss-120b) -> Zero-cost, high-speed LPU inference.
 * 2. Groq AI Backup Model (e.g. qwen/qwen3.8-27b) -> If primary model is rate-limited.
 * 3. Standard Cloud Fallback (Vertex AI / OpenAI via callLLM) -> If Groq daily/minutely limits are hit.
 */
export async function callQuizLLM(
  sessionKey: string,
  systemPrompt: string,
  userPrompt: string,
  fallbackProvider?: string,
  fallbackModel?: string
): Promise<QuizLLMResponse> {
  if (env.GROQ_API_KEY) {
    const primaryModel = env.GROQ_QUIZ_MODEL || 'openai/gpt-oss-120b';
    const backupModel = env.GROQ_QUIZ_BACKUP_MODEL || 'qwen/qwen3.8-27b';

    // Step 1: Try Primary Groq Model
    try {
      const startTime = Date.now();
      logger.info(`[Quiz Generator] Invoking Groq AI Primary (${primaryModel})...`);
      const res = await tryGroqCompletion(primaryModel, systemPrompt, userPrompt);
      if (res) {
        const duration = Date.now() - startTime;
        logger.info(`⚡ [Quiz Generator] Groq AI (${primaryModel}) completed in ${duration}ms (${res.totalTokens} tokens). Cost: $0.00.`);
        return {
          text: res.text,
          provider: 'groq',
          model: primaryModel,
          promptTokens: res.promptTokens,
          completionTokens: res.completionTokens,
          totalTokens: res.totalTokens,
        };
      }
    } catch (primaryErr: any) {
      const status = primaryErr?.response?.status;
      const errMsg = primaryErr?.response?.data?.error?.message || primaryErr?.message || 'Unknown error';
      logger.warn(`⚠️ [Quiz Generator] Groq primary model (${primaryModel}) failed (HTTP ${status}): ${errMsg}. Trying Groq backup model (${backupModel})...`);

      // Step 2: Try Backup Groq Model
      try {
        const startTime = Date.now();
        const res = await tryGroqCompletion(backupModel, systemPrompt, userPrompt);
        if (res) {
          const duration = Date.now() - startTime;
          logger.info(`⚡ [Quiz Generator] Groq AI Backup (${backupModel}) completed in ${duration}ms (${res.totalTokens} tokens). Cost: $0.00.`);
          return {
            text: res.text,
            provider: 'groq',
            model: backupModel,
            promptTokens: res.promptTokens,
            completionTokens: res.completionTokens,
            totalTokens: res.totalTokens,
          };
        }
      } catch (backupErr: any) {
        const bStatus = backupErr?.response?.status;
        const bErrMsg = backupErr?.response?.data?.error?.message || backupErr?.message || 'Unknown error';
        logger.warn(`⚠️ [Quiz Generator] Groq backup model (${backupModel}) also limit-hit or unavailable (HTTP ${bStatus}): ${bErrMsg}. Falling back to standard LLM provider.`);
      }
    }
  }

  // Step 3: Seamless Fallback to Vertex AI / OpenAI via callLLM
  logger.info(`[Quiz Generator] Falling back to standard provider (${fallbackProvider || env.DEFAULT_LLM_PROVIDER})...`);
  const standardResult = await callLLM(sessionKey, systemPrompt, userPrompt, fallbackProvider, fallbackModel);
  return {
    text: standardResult.text,
    provider: standardResult.provider,
    model: standardResult.model,
    promptTokens: standardResult.promptTokens,
    completionTokens: standardResult.completionTokens,
    totalTokens: standardResult.totalTokens,
  };
}
