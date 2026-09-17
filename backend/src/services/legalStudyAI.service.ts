import { callLLM } from '../routes/ai.routes';
import { GuardrailService } from './guardrail.service';
import { logger } from '../utils/logger';

export interface StudyPlanParams {
  targetExam: string; // e.g. "JUDICIARY", "HJS", "ADP", "BOTH", "JAG", "SEBI_LEGAL", "IBPS_SO_LAW", "UGC_NET_LAW", "CLAT_PG", "PSU_LEGAL"
  targetState: string; // e.g. "DELHI", "UP", "MP", "BIHAR", "RAJASTHAN"
  availableMonths: number; // e.g. 3, 6, 12
  dailyHours: number;
  stageFocus: 'PRELIMS' | 'MAINS' | 'INTEGRATED';
}

export interface EvaluateAnswerParams {
  question: string;
  userAnswer: string;
  subject?: string;
  targetExam?: string;
  state?: string;
}

export interface SectionDrillParams {
  actName: string;
  chapterOrTopic?: string;
  difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  count?: number;
}

export interface GenerateMainsQuestionParams {
  subject: string;
  topic?: string;
  targetExam?: string;
  targetState?: string;
  questionType?: 'PROBLEM_BASED' | 'THEORETICAL' | 'JUDGMENT_WRITING' | 'MIXED';
}

export interface SolvePYQParams {
  paperId?: string;
  paperTitle: string;
  year?: number | string;
  state?: string;
  targetExam?: string;
  stage?: 'PRELIMS' | 'MAINS' | 'INTEGRATED';
  paperContent?: string;
  specificQuestion?: string;
}

export class LegalStudyAIService {
  /**
   * Generates a state-tailored, month-by-month study blueprint for Judicial Services or ADP aspirants.
   */
  static async generateStudyPlan(userId: string, params: StudyPlanParams) {
    const examMap: Record<string, string> = {
      JUDICIARY: 'State Judicial Service (Civil Judge / PCS-J / JMFC)',
      HJS: 'Higher Judicial Services (Direct District Judge / ADJ)',
      ADP: 'Assistant Public Prosecutor (ADP / APO / APP / ADPO)',
      BOTH: 'State Judicial Service & Public Prosecutor Combined Preparation',
      JAG: 'Judge Advocate General (JAG - Indian Armed Forces Legal Branch)',
      SEBI_LEGAL: 'SEBI Grade A Officer (Legal Stream - Securities & Capital Markets)',
      IBPS_SO_LAW: 'IBPS SO / RBI Grade B (Bank Law Officer Scale I & II)',
      UGC_NET_LAW: 'UGC-NET / JRF (Law - Assistant Professor & Research Fellowship)',
      CLAT_PG: 'CLAT PG / AILET PG (LL.M Entrance & National PSU Recruitment)',
      PSU_LEGAL: 'PSU In-House Law Officer (ONGC, IOCL, NTPC, PowerGrid Legal Counsel)',
    };
    const examTitle = examMap[params.targetExam] || params.targetExam;

    const streamGuidance: Record<string, string> = {
      HJS: 'Focus heavily on commercial courts, arbitration, complex civil/criminal trial procedure, judgment writing, and framing of issues/charges for practicing advocates.',
      JAG: 'Include the Army Act 1950, Navy Act, Air Force Act, Court Martial proceedings, Military Law jurisprudence, and standard constitutional/criminal law.',
      SEBI_LEGAL: 'Emphasize SEBI Act 1992, Companies Act 2013, Securities Contracts (Regulation) Act (SCRA), Depositories Act, Insider Trading regulations, and Takeover code.',
      IBPS_SO_LAW: 'Focus on Banking Regulation Act 1949, RBI Act 1934, SARFAESI Act 2002, IBC 2016, Negotiable Instruments Act 1881, Recovery of Debts (DRT), and consumer protection.',
      UGC_NET_LAW: 'Cover Jurisprudence, Constitutional & Administrative Law, Public International Law & IHL, Law of Crimes, Torts & Consumer Law, Commercial Law, Family Law, Environment & Human Rights, and IPR.',
      CLAT_PG: 'Exhaustive focus on constitutional law, landmark Supreme Court constitutional bench rulings, jurisprudence, international law, and recent legal developments.',
      PSU_LEGAL: 'Prioritize Contract Act, Arbitration & Conciliation Act 1996, Specific Relief, Labor & Industrial Laws, Companies Act, Environment protection, and corporate contract drafting.',
    };
    const extraGuidance = streamGuidance[params.targetExam] ? `SPECIALIZED STREAM SYLLABUS DIRECTIVE: ${streamGuidance[params.targetExam]}` : '';

    const systemPrompt = `You are the Chief Academic Mentor for Judicial Services, Public Prosecutor, and Competitive Legal Examinations in India.
Your mission is to formulate an exhaustive, highly disciplined, examination-specific preparation roadmap.

TARGET STATE / JURISDICTION: ${params.targetState.toUpperCase()}
TARGET EXAMINATION: ${examTitle}
PREPARATION WINDOW: ${params.availableMonths} Months
DAILY STUDY TIME: ${params.dailyHours} Hours/Day
FOCUS STAGE: ${params.stageFocus}
${extraGuidance}

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
5. FORMATTING & TABLE RULES:
   - For each phase, structure study schedules using standard GitHub-Flavored Markdown (GFM) tables:
     | Week | Subject / Module | Daily Focus (Hours) | Key Pedagogical Activities & Bare Acts |
     |------|------------------|---------------------|---------------------------------------|
   - Never leave empty cells (e.g. repeat the week number or write "Week 1 (Contd.)" rather than leaving "| |").
   - Do NOT insert blank empty lines between the table header row and data rows.
   - Format Phase titles explicitly as: "### Phase 1: Foundational Phase (Month 1)" followed by "Objectives: ...".
   - Include clear bullet points for High-Yield Case Laws, Local Act strategies, and Mains Answer Writing techniques.`;

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

  /**
   * Generates authentic, dynamic Judicial Mains Examination questions (problem-based or theoretical) on demand.
   */
  static async generateMainsQuestion(userId: string, params: GenerateMainsQuestionParams) {
    const subject = params.subject || 'Law';
    const topic = params.topic ? `Specific Topic/Doctrine: ${params.topic}` : 'High-yield Mains examination topics';
    const exam = params.targetExam || 'State Judicial Services (Civil Judge / PCS-J)';
    const state = params.targetState || 'General State Judiciary';
    const qType = params.questionType || 'PROBLEM_BASED';

    const systemPrompt = `You are a Senior Judicial Academy Paper Setter and former High Court Justice drafting questions for the ${exam} Mains Examination (${state}).
Your task is to draft an authentic, challenging, high-yield Judicial Mains Examination question.

SUBJECT: ${subject}
${topic}
QUESTION STYLE: ${qType} (e.g. realistic factual scenario dispute, complex statutory controversy, or judgment writing problem)

REQUIREMENTS:
1. Provide an authentic, high-standard Mains question:
   - If PROBLEM_BASED: Present a realistic legal dispute with parties (e.g., A, B, and C), conflicting rights, procedural actions, or evidentiary admissibility, and ask the candidate to decide with reference to statutory provisions and leading case law.
   - If THEORETICAL: Pose an analytical, multi-layered question examining statutory provisions, doctrines, landmark precedents, and constitutional/jurisprudential nuances.
   - If JUDGMENT_WRITING: Provide brief prosecution/defense or plaintiff/defendant allegations, framed issues, and ask the candidate to frame charges or write the operative judgment.
2. Ensure the question tests New Criminal Laws (BNS 2023, BNSS 2023, BSA 2023) if Criminal Law or Evidence is selected.
3. Provide statutory pointers (the key sections, doctrines, or cases the examiner expects in a model answer).
4. Output must be valid JSON conforming to this schema:
{
  "subject": "${subject}",
  "topic": "Name of specific legal doctrine or topic",
  "marks": 20,
  "suggestedTimeMinutes": 25,
  "question": "Full text of the question...",
  "statutoryPointers": ["Section ...", "Doctrine of ...", "Landmark case ..."],
  "modelAnswerOutline": "Brief 2-3 bullet point outline of expected reasoning"
}
Do NOT wrap in markdown code fence. Output ONLY valid raw JSON.`;

    const userMessage = `Draft a new ${qType} Judicial Mains question for ${subject} (${topic}) for ${exam} in ${state}.`;
    const sessionKey = `legal-mains-q-${userId}-${Date.now()}`;
    const llmResp = await callLLM(sessionKey, systemPrompt, userMessage);

    let parsed: any;
    try {
      const cleanJson = llmResp.text.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleanJson);
    } catch {
      logger.warn('[Legal Study AI] Fallback JSON parse for mains question generation.');
      parsed = {
        subject,
        topic: params.topic || 'Substantive & Procedural Law',
        marks: 20,
        suggestedTimeMinutes: 25,
        question: llmResp.text,
        statutoryPointers: ['Relevant statutory provisions and leading Supreme Court precedents'],
        modelAnswerOutline: 'Address the core controversy, cite the relevant section, apply precedents, and conclude with the legal decision.',
      };
    }

    await GuardrailService.recordTokenUsage({
      userId,
      promptTokens: llmResp.promptTokens,
      completionTokens: llmResp.completionTokens,
      totalTokens: llmResp.totalTokens,
      provider: llmResp.provider,
      model: llmResp.model,
      feature: 'LEGAL_MAINS_QUESTION_GEN',
    });

    return {
      ...parsed,
      targetExam: exam,
      targetState: state,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Solves a State Judicial or Prosecution Previous Year Question Paper (PYQ)
   * generating step-by-step Prelims solutions or publication-quality Mains model answers.
   */
  static async solvePYQPaper(userId: string, params: SolvePYQParams) {
    const stage = params.stage || 'MAINS';
    const exam = params.targetExam || 'State Judicial Service';
    const state = params.state || 'General State Judiciary';

    let specificDirective = '';
    if (params.specificQuestion) {
      specificDirective = `FOCUSED QUESTION TO SOLVE:
"${params.specificQuestion}"
Solve this specific question thoroughly following official examination and judicial evaluation standards.`;
    } else {
      specificDirective = `PAPER CONTENT / QUESTIONS:
${params.paperContent || 'Standard Past Year Examination Paper for ' + params.paperTitle}
Provide a comprehensive question-by-question solution and answer key for this past year paper.`;
    }

    const systemPrompt = `You are the Chief Academic Jurist and Master Solution Author for State Judicial Services (Civil Judge / PCS-J, Higher Judicial Services HJS, and Prosecution Officer ADP/APO) Examination Boards.
You are generating official, comprehensive examination solutions for:
PAPER: ${params.paperTitle} (${params.year || 'Past Year Paper'})
JURISDICTION: ${state}
EXAMINATION: ${exam}
EXAM STAGE: ${stage}

${specificDirective}

SOLVING STANDARDS:
${stage === 'PRELIMS' ? `
FOR PRELIMS (OBJECTIVE MCQs):
1. State the Correct Option clearly: **Correct Answer: [Option X]**.
2. Provide the Exact Bare Act Section Citation (incorporate Bharatiya Nyaya Sanhita 2023, BNSS 2023, BSA 2023, CPC 1908, Constitution of India, and relevant local state acts).
3. Pedagogical Explanation: Explain the legal principle, proviso, or statutory exception that governs this question.
4. Distractor Analysis: Briefly explain why the other options are legally incorrect or inapposite.
` : `
FOR MAINS (SUBJECTIVE / PROBLEM-BASED / JUDGMENT WRITING):
1. **Issue Identification & Framing**: Explicitly frame the core legal controversies (e.g., Issue 1, Issue 2).
2. **Statutory Provisions**: Cite the exact Sections, Sub-sections, and Rules applicable (including New Criminal Laws BNS/BNSS/BSA transition notes where applicable).
3. **Landmark Case Laws**: Cite authoritative Supreme Court and High Court precedents with precise case names and their legal ratios.
4. **Judicial Reasoning & Application**: Apply the statutory rule and case ratios systematically to the given problem facts.
5. **Operative Decision / Conclusion**: Provide the conclusive judicial finding, decree, or order that a top-ranker would write in the actual Mains exam.
`}

FORMATTING:
Format in crisp, beautifully structured GitHub Markdown with clear headers (##, ###), bullet points, bold sections, and callout blocks. Include a summary scorecard / key takeaways at the top.`;

    const userMessage = `Generate the comprehensive judicial solutions and answer key for: ${params.paperTitle} (${state}, ${stage}). ${params.specificQuestion ? 'Specific Question: ' + params.specificQuestion : ''}`;
    const sessionKey = `legal-pyq-solve-${userId}-${Date.now()}`;
    const startTime = Date.now();
    const llmResp = await callLLM(sessionKey, systemPrompt, userMessage);
    const latencyMs = Date.now() - startTime;

    await GuardrailService.recordTokenUsage({
      userId,
      promptTokens: llmResp.promptTokens,
      completionTokens: llmResp.completionTokens,
      totalTokens: llmResp.totalTokens,
      provider: llmResp.provider,
      model: llmResp.model,
      feature: 'LEGAL_PYQ_SOLVE',
    });

    return {
      paperTitle: params.paperTitle,
      state,
      targetExam: exam,
      stage,
      year: params.year,
      specificQuestion: params.specificQuestion || null,
      solution: llmResp.text,
      solutionsMarkdown: llmResp.text,
      model: llmResp.model,
      latencyMs,
      tokens: {
        promptTokens: llmResp.promptTokens,
        completionTokens: llmResp.completionTokens,
        totalTokens: llmResp.totalTokens,
      },
      solvedAt: new Date().toISOString(),
    };
  }

  /**
   * Explores a specific section or legal doctrine of an Act, providing verbatim text,
   * predecessor cross-referencing (BNS/BNSS/BSA), explanations, illustrations, and judicial exam rulings.
   */
  static async exploreStatuteSection(userId: string, actName: string, query: string) {
    const systemPrompt = `You are the Supreme Legal Scholar and Master Bare Act Commentator for Indian Law (Indian Penal Code/BNS 2023, CrPC/BNSS 2023, Evidence Act/BSA 2023, CPC 1908, Constitution of India).
Your task is to provide an authoritative, comprehensive examination-grade breakdown of the requested statutory section or topic.

ACT: ${actName}
QUERY / SECTION: ${query}

STRUCTURE YOUR RESPONSE IN GITHUB MARKDOWN:
1. **Statutory Heading & Section Number**: Cite exact Section and Act.
2. **Verbatim Bare Act Text & Ingredients**: Provide the exact statutory provisions, explanations, provisos, and essential ingredients.
3. **Transition & Cross-Referencing**:
   - If BSA 2023: Compare with corresponding Section in Indian Evidence Act 1872.
   - If BNS 2023: Compare with Indian Penal Code 1860.
   - If BNSS 2023: Compare with Code of Criminal Procedure 1973.
   - Explicitly highlight what has changed or remained constant.
4. **Landmark Supreme Court Judgments**: Cite 2 to 4 authoritative constitutional/appellate rulings with case titles, years, and legal ratios.
5. **Judicial & ADP Examination Hotspot**: What questions (Prelims MCQs or Mains problem scenarios) are commonly asked from this section.`;

    const userMessage = `Provide the authoritative bare act text and analysis for ${query} under ${actName}.`;
    const sessionKey = `legal-section-explore-${userId}-${Date.now()}`;
    const startTime = Date.now();
    const llmResp = await callLLM(sessionKey, systemPrompt, userMessage);
    const latencyMs = Date.now() - startTime;

    await GuardrailService.recordTokenUsage({
      userId,
      promptTokens: llmResp.promptTokens,
      completionTokens: llmResp.completionTokens,
      totalTokens: llmResp.totalTokens,
      provider: llmResp.provider,
      model: llmResp.model,
      feature: 'LEGAL_SECTION_EXPLORE',
    });

    return {
      actName,
      query,
      content: llmResp.text,
      model: llmResp.model,
      latencyMs,
      tokens: {
        promptTokens: llmResp.promptTokens,
        completionTokens: llmResp.completionTokens,
        totalTokens: llmResp.totalTokens,
      },
    };
  }
}
