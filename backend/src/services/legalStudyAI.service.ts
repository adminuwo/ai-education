import { callLLM } from '../routes/ai.routes';
import { GuardrailService } from './guardrail.service';
import { logger } from '../utils/logger';

export interface StudyPlanParams {
  targetExam: 'JUDICIARY' | 'ADP' | 'BOTH';
  targetState: string; // e.g. "DELHI", "UP", "MP", "BIHAR", "RAJASTHAN"
  availableMonths: number; // e.g. 3, 6, 12
  dailyHours: number;
  stageFocus: 'PRELIMS' | 'MAINS' | 'INTEGRATED';
}

export interface EvaluateAnswerParams {
  question: string;
  userAnswer: string;
  subject?: string;
  targetExam?: 'JUDICIARY' | 'ADP';
  state?: string;
}

export interface SectionDrillParams {
  actName: string;
  chapterOrTopic?: string;
  difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  count?: number;
}

export class LegalStudyAIService {
  /**
   * Generates a state-tailored, month-by-month study blueprint for Judicial Services or ADP aspirants.
   */
  static async generateStudyPlan(userId: string, params: StudyPlanParams) {
    const examTitle = params.targetExam === 'ADP'
      ? `Assistant District Public Prosecutor (ADP / APO / APP)`
      : params.targetExam === 'JUDICIARY'
      ? `State Judicial Service (Civil Judge / PCS-J)`
      : `Judicial Services & Assistant Public Prosecutor Combined`;

    const systemPrompt = `You are the Chief Academic Mentor for Judicial Services (Civil Judge / PCS-J) and Public Prosecutor (ADP / APO) examinations in India.
Your mission is to formulate an exhaustive, highly disciplined, state-specific preparation roadmap.

TARGET STATE: ${params.targetState.toUpperCase()}
TARGET EXAMINATION: ${examTitle}
PREPARATION WINDOW: ${params.availableMonths} Months
DAILY STUDY TIME: ${params.dailyHours} Hours/Day
FOCUS STAGE: ${params.stageFocus}

REQUIREMENTS:
1. Provide a phase-wise breakdown (Foundational Phase $\rightarrow$ Bare Act Mastery & Procedural Laws $\rightarrow$ Mains Answer Writing & Local Laws $\rightarrow$ Mock Drills & Revision).
2. Detail state-specific local laws according to the selected state:
   - Delhi: Delhi Rent Control Act 1958, Commercial Courts Act 2015, High Court Rules.
   - Uttar Pradesh: UP Revenue Code 2006, UP Urban Buildings Act 1972, UP Municipalities Act.
   - Madhya Pradesh: MP Accommodation Control Act 1961, MP Land Revenue Code 1959.
   - Bihar: Bihar Buildings (Lease, Rent & Eviction) Control Act 1982, Bihar Land Reforms.
   - Rajasthan: Rajasthan Rent Control Act 2001, Rajasthan Land Revenue Act 1956.
   - Haryana: Haryana Urban (Control of Rent and Eviction) Act 1973, Punjab Courts Act 1918.
   - Punjab: East Punjab Urban Rent Restriction Act 1949, Punjab Courts Act 1918.
   - Maharashtra: Maharashtra Rent Control Act 1999, Maharashtra Land Revenue Code 1966, Bombay Police Act.
   - Gujarat: Gujarat Court Fees Act 2004, Gujarat Rent Control / Land Tenancy Acts.
   - West Bengal: West Bengal Premises Tenancy Act 1997, West Bengal Land Reforms Act 1955.
   - Uttarakhand: UP Zamindari Abolition & Land Reforms Act as applicable to UK, UK Urban Buildings Act.
   - Himachal Pradesh: HP Urban Rent Control Act 1987, HP Courts Act 1976.
   - Jharkhand: Chota Nagpur Tenancy Act (CNTA) 1908, Santhal Parganas Tenancy Act (SPTA) 1949.
   - Chhattisgarh: Chhattisgarh Rent Control Act 2011, CG Land Revenue Code, CG Excise Act.
   - Odisha: Odisha House Rent Control Act, Odisha Land Reforms Act 1960.
   - Karnataka: Karnataka Rent Act 1999, Karnataka Land Revenue Act 1964.
   - Tamil Nadu: Tamil Nadu Regulation of Rights and Responsibilities of Landlords and Tenants Act 2017.
   - Kerala: Kerala Buildings (Lease and Rent Control) Act 1965.
   - Telangana: Telangana Buildings (Lease, Rent and Eviction) Control Act, Telangana Land Revenue.
   - Andhra Pradesh: AP Buildings (Lease, Rent and Eviction) Control Act, AP Land Reforms.
   - Assam & North-East: Assam Urban Areas Rent Control Act 1972, Assam Land and Revenue Regulation 1886.
   - Jammu & Kashmir: J&K Civil Courts Act, Local Tenancy & Land Revenue enactments.
   - Goa: Goa Buildings (Lease, Rent and Eviction) Control Act 1968.
   - Other States: In-depth local acts, rent control legislation, land revenue codes, and customary laws for the jurisdiction.
3. Emphasize the transition to New Criminal Laws (BNS 2023, BNSS 2023, BSA 2023) alongside legacy comparative references.
4. Provide daily hourly time-blocks (e.g. 2 hrs Bare Act memorization + 2 hrs Concept study + 1 hr Mains answer writing + 1 hr Current legal GK).
5. Format in crisp GitHub Markdown with tables and bullet points.`;

    const userMessage = `Create an exhaustive, structured study plan for ${params.targetState} ${examTitle} for ${params.availableMonths} months at ${params.dailyHours} hours daily focus.`;

    const sessionKey = `legal-plan-${userId}-${Date.now()}`;
    const llmResp = await callLLM(sessionKey, systemPrompt, userMessage);

    // Record token usage for institutional telemetry
    await GuardrailService.recordTokenUsage({
      userId,
      promptTokens: llmResp.promptTokens,
      completionTokens: llmResp.completionTokens,
      totalTokens: llmResp.totalTokens,
      provider: llmResp.provider,
      model: llmResp.model,
      feature: 'LEGAL_STUDY_PLAN',
    });

    return {
      examTitle,
      state: params.targetState,
      availableMonths: params.availableMonths,
      dailyHours: params.dailyHours,
      stageFocus: params.stageFocus,
      planMarkdown: llmResp.text,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Compares erstwhile criminal laws with the New Criminal Laws (BNS, BNSS, BSA).
   */
  static async compareCriminalLaws(userId: string, query: string) {
    const systemPrompt = `You are a Senior Judicial Research Scholar and Legal Draftsman specializing in the Bharatiya Nyaya Sanhita (BNS) 2023, Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023, and Bharatiya Sakshya Adhiniyam (BSA) 2023.

USER QUERY: "${query}"

YOUR TASK:
1. Identify the relevant sections in both the old statutes (IPC 1860 / CrPC 1973 / IEA 1872) and the new statutes (BNS 2023 / BNSS 2023 / BSA 2023).
2. Outline the exact statutory changes (substantive additions, deleted provisions, revised penalties, procedural mandates like electronic recording or zero FIR).
3. Explain how this section is typically tested in State Judicial Service (PCS-J) Preliminary and Mains examinations.
4. Highlight critical judicial caveats or landmark interpretations.
5. Format with a clear Comparison Table (Old Law vs New Law) followed by Judicial Exam Hotspots.`;

    const userMessage = `Analyze and compare: ${query}`;
    const sessionKey = `legal-compare-${userId}-${Date.now()}`;
    const llmResp = await callLLM(sessionKey, systemPrompt, userMessage);

    await GuardrailService.recordTokenUsage({
      userId,
      promptTokens: llmResp.promptTokens,
      completionTokens: llmResp.completionTokens,
      totalTokens: llmResp.totalTokens,
      provider: llmResp.provider,
      model: llmResp.model,
      feature: 'LEGAL_LAW_TRANSITION',
    });

    return {
      query,
      analysis: llmResp.text,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Evaluates a Judicial Mains Subjective Answer against judicial exam grading rubrics.
   */
  static async evaluateMainsAnswer(userId: string, params: EvaluateAnswerParams) {
    const exam = params.targetExam || 'JUDICIARY';
    const state = params.state || 'General State Judicial Service';

    const systemPrompt = `You are an expert Judicial Services Examination Evaluator (serving as a retired High Court Judge / Senior Judicial Academy Assessor).
You are evaluating a candidate's answer for the ${exam} Mains Examination (${state}).

SUBJECT: ${params.subject || 'Law'}

EXAM QUESTION:
"${params.question}"

CANDIDATE'S ANSWER:
"${params.userAnswer}"

EVALUATION RUBRIC (Max Marks: 20):
1. Issue Identification & Framing (4 Marks): Did the candidate spot the core legal controversy?
2. Statutory Provisions & Section Accuracy (5 Marks): Were exact Sections of the Bare Act (BNS/BNSS/BSA/CPC/Constitution) cited accurately?
3. Landmark Precedents & Rulings (4 Marks): Did the candidate cite authoritative Supreme Court / High Court decisions?
4. Judicial Reasoning & Legal Analysis (5 Marks): Is the reasoning logical, analytical, and grounded in jurisprudence rather than generic storytelling?
5. Presentation, Structure & Conclusion (2 Marks): Clean headings, ratio decidendi, and concluding order.

OUTPUT FORMAT:
Provide your evaluation in two distinct parts:
PART 1: Structured Evaluation Summary (Score out of 20, Strengths, Fatal Errors, Model Answer Points).
PART 2: Complete Model Answer suitable for a top-ranker in the ${state} Judicial Mains.`;

    const userMessage = `Please evaluate my answer to the question: "${params.question}". Candidate Answer: "${params.userAnswer}"`;
    const sessionKey = `legal-eval-${userId}-${Date.now()}`;
    const llmResp = await callLLM(sessionKey, systemPrompt, userMessage);

    await GuardrailService.recordTokenUsage({
      userId,
      promptTokens: llmResp.promptTokens,
      completionTokens: llmResp.completionTokens,
      totalTokens: llmResp.totalTokens,
      provider: llmResp.provider,
      model: llmResp.model,
      feature: 'LEGAL_MAINS_EVAL',
    });

    return {
      question: params.question,
      evaluation: llmResp.text,
      subject: params.subject,
      targetExam: exam,
      evaluatedAt: new Date().toISOString(),
    };
  }

  /**
   * Generates Prelims Bare Act MCQ Drills with section citations.
   */
  static async generateSectionDrill(userId: string, params: SectionDrillParams) {
    const count = Math.min(Math.max(params.count || 5, 3), 10);
    const difficulty = params.difficulty || 'INTERMEDIATE';

    const systemPrompt = `You are the Examination Director for Judicial Services (Civil Judge / PCS-J) Preliminary Examinations.
Create a high-yield Bare Act Practice Drill for:
ACT: ${params.actName}
TOPIC / CHAPTER: ${params.chapterOrTopic || 'All Essential Sections'}
DIFFICULTY: ${difficulty}
NUMBER OF QUESTIONS: ${count}

REQUIREMENTS:
- Generate exactly ${count} Multiple Choice Questions (MCQs).
- Reflect actual State Judicial Preliminary examination patterns (e.g. section number recall, exception/proviso questions, factual scenario questions, limitation periods).
- Output must be pure JSON conforming to this schema:
[
  {
    "id": 1,
    "question": "Question text...",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "sectionCitation": "Section X of ...",
    "explanation": "Detailed pedagogical explanation citing the relevant subsection or proviso..."
  }
]
Do not wrap in markdown code fence. Output ONLY valid raw JSON.`;

    const userMessage = `Generate ${count} ${difficulty} Prelims MCQs for ${params.actName} (${params.chapterOrTopic || 'Key Sections'}).`;
    const sessionKey = `legal-drill-${userId}-${Date.now()}`;
    const llmResp = await callLLM(sessionKey, systemPrompt, userMessage);

    let questions: any[] = [];
    try {
      const cleanJson = llmResp.text.replace(/```json/g, '').replace(/```/g, '').trim();
      questions = JSON.parse(cleanJson);
    } catch {
      logger.warn('[Legal Study AI] Fallback JSON parse for section drill.');
      questions = [
        {
          id: 1,
          question: `Under Section 103 of Bharatiya Nyaya Sanhita (BNS), 2023, what is the punishment for murder?`,
          options: [
            'Imprisonment for 10 years and fine',
            'Death or imprisonment for life, and shall also be liable to fine',
            'Life imprisonment only without possibility of death sentence',
            'Rigorous imprisonment for 7 years',
          ],
          correctIndex: 1,
          sectionCitation: 'Section 103, Bharatiya Nyaya Sanhita, 2023',
          explanation: 'Section 103(1) of BNS 2023 provides that whoever commits murder shall be punished with death or imprisonment for life, and shall also be liable to fine. Sub-section (2) prescribes specific penalties for mob lynching.',
        },
        {
          id: 2,
          question: `Which section of the Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023 mandates audio-video electronic recording of search and seizure?`,
          options: ['Section 35', 'Section 105', 'Section 173', 'Section 482'],
          correctIndex: 1,
          sectionCitation: 'Section 105, Bharatiya Nagarik Suraksha Sanhita, 2023',
          explanation: 'Section 105 BNSS introduces mandatory audio-video electronic recording of search, seizure, and preparation of seizure memo, forwarded without delay to the Magistrate.',
        },
      ];
    }

    await GuardrailService.recordTokenUsage({
      userId,
      promptTokens: llmResp.promptTokens,
      completionTokens: llmResp.completionTokens,
      totalTokens: llmResp.totalTokens,
      provider: llmResp.provider,
      model: llmResp.model,
      feature: 'LEGAL_SECTION_DRILL',
    });

    return {
      actName: params.actName,
      difficulty,
      totalQuestions: questions.length,
      questions,
      generatedAt: new Date().toISOString(),
    };
  }
}
