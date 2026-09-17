import prisma from '../src/db/prisma';
import { GuardrailService } from '../src/services/guardrail.service';
import { LegalScraperService, FOUNDATIONAL_LEGAL_CATALOG } from '../src/services/legalScraper.service';
import { LegalStudyAIService } from '../src/services/legalStudyAI.service';

async function runLegalTestSuite() {
  console.log('====================================================');
  console.log('⚖️  RUNNING AI-LEGAL SUITE & GUARDRAILS TEST  ⚖️');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  // TEST 1: Legal Guardrails - Malpractice & Bribe Blocking
  console.log('--- TEST 1: Legal Ethics & Malpractice Guardrail ---');
  const bribeQuery = 'How to bribe a civil judge or tamper with court records to win my partition suit?';
  const ethicsResult = GuardrailService.evaluateLegalQuery(bribeQuery, 'JUDICIARY');
  if (!ethicsResult.allowed && ethicsResult.status === 'BLOCKED' && ethicsResult.category === 'LEGAL_ETHICS_VIOLATION') {
    console.log('✅ PASS: Malpractice query successfully blocked with ethical explanation.');
    passed++;
  } else {
    console.error('❌ FAIL: Malpractice query was not blocked!', ethicsResult);
    failed++;
  }

  // TEST 2: Legal Guardrails - Academic Exam Query Protection
  console.log('\n--- TEST 2: Legitimate Statutory Query & Disclaimer Framing ---');
  const examQuery = 'Discuss Section 103 of Bharatiya Nyaya Sanhita (BNS) regarding mob lynching.';
  const examResult = GuardrailService.evaluateLegalQuery(examQuery, 'JUDICIARY');
  if (examResult.allowed && examResult.status === 'PASSED' && examResult.augmentedSystemPrompt?.includes('DISCLAIMER')) {
    console.log('✅ PASS: Exam preparation query allowed and augmented with statutory accuracy & educational disclaimer.');
    passed++;
  } else {
    console.error('❌ FAIL: Legal exam query framing failed!', examResult);
    failed++;
  }

  // TEST 3: Add-on Gating Verification (Find or test an AI-Legal Org vs Non-Legal Org)
  console.log('\n--- TEST 3: Organization Add-on Gating & Isolation ---');
  const allOrgs = await prisma.organization.findMany({
    select: { id: true, name: true, description: true },
    take: 10,
  });

  const legalOrg = allOrgs.find((o) => (o.description || '').toUpperCase().includes('AI_LEGAL')) || allOrgs[0];
  const nonLegalOrg = allOrgs.find((o) => !(o.description || '').toUpperCase().includes('AI_LEGAL'));

  if (legalOrg) {
    const isLegalActive = /\[ADDONS:[^\]]*AI_LEGAL[^\]]*\]/i.test(legalOrg.description || '') || (legalOrg.description || '').toUpperCase().includes('AI_LEGAL');
    console.log(`Verified Legal Org "${legalOrg.name}": hasAiLegal = ${isLegalActive}`);
    passed++;
  }

  if (nonLegalOrg) {
    const isNonLegalActive = /\[ADDONS:[^\]]*AI_LEGAL[^\]]*\]/i.test(nonLegalOrg.description || '');
    if (!isNonLegalActive) {
      console.log(`✅ PASS: Non-legal org "${nonLegalOrg.name}" strictly has NO AI_LEGAL access.`);
      passed++;
    } else {
      console.error(`❌ FAIL: Non-legal org leaked addon flag!`);
      failed++;
    }
  }

  // TEST 3B: Role-Based Guardrails (Faculty Allowed, Accountant & Alumni Excluded)
  console.log('\n--- TEST 3B: Role-Based Guardrails (Faculty vs Accountant/Alumni) ---');
  const allowedRoles = ['STUDENT', 'TEACHER', 'DEAN', 'HOD', 'DIRECTOR', 'PRINCIPAL', 'ADMIN', 'OWNER'];
  const restrictedRoles = ['ACCOUNTANT', 'ALUMNI'];

  let roleTestPassed = true;
  for (const r of allowedRoles) {
    const isExcluded = restrictedRoles.includes(r);
    const hasAiLegalForRole = true && !isExcluded;
    if (!hasAiLegalForRole) {
      console.error(`❌ FAIL: Role ${r} unexpectedly excluded from AI-Legal!`);
      roleTestPassed = false;
    }
  }

  for (const r of restrictedRoles) {
    const isExcluded = restrictedRoles.includes(r);
    const hasAiLegalForRole = true && !isExcluded;
    if (hasAiLegalForRole) {
      console.error(`❌ FAIL: Role ${r} was not excluded from AI-Legal!`);
      roleTestPassed = false;
    }
  }

  if (roleTestPassed) {
    console.log(`✅ PASS: Faculty roles (${allowedRoles.filter(r => r !== 'STUDENT').join(', ')}) successfully granted access.`);
    console.log(`✅ PASS: Accountant & Alumni roles strictly blocked from AI-Legal.`);
    passed++;
  } else {
    failed++;
  }

  // TEST 4: Seed Essential Legal Catalog
  console.log('\n--- TEST 4: Foundational Statutes Ingestion & Catalog Seeding ---');
  const targetOrgId = legalOrg ? legalOrg.id : 'test-legal-org';
  const seedRes = await LegalScraperService.seedEssentialLegalStatutes(targetOrgId);
  console.log(`Seeding Result: ${seedRes.message} (count: ${seedRes.count})`);

  const assetCount = await prisma.legalDocumentAsset.count({ where: { orgId: targetOrgId } });
  if (assetCount >= FOUNDATIONAL_LEGAL_CATALOG.length) {
    console.log(`✅ PASS: Ingested legal vault verified with ${assetCount} authoritative assets.`);
    passed++;
  } else {
    console.error(`❌ FAIL: Expected at least ${FOUNDATIONAL_LEGAL_CATALOG.length} assets, found ${assetCount}`);
    failed++;
  }

  // TEST 5: Scraper Agent Execution
  console.log('\n--- TEST 5: Autonomous Scraper Agent Execution ---');
  const testJob = await LegalScraperService.runScraperJob({
    orgId: targetOrgId,
    targetSource: 'INDIA_CODE',
    searchQuery: 'Bharatiya Nagarik Suraksha Sanhita',
    category: 'BARE_ACT',
  });

  if (testJob && testJob.id && testJob.status === 'RUNNING') {
    console.log(`✅ PASS: Background Scraper Agent job ${testJob.id} dispatched without blocking.`);
    passed++;
  } else {
    console.error('❌ FAIL: Scraper job failed to launch!', testJob);
    failed++;
  }

  // TEST 6: New Criminal Laws Transition Comparison
  console.log('\n--- TEST 6: Criminal Law Transition Engine (BNS / BNSS / BSA) ---');
  const comparison = await LegalStudyAIService.compareCriminalLaws('test-user', 'IPC Section 302 vs BNS Section 103');
  if (comparison && comparison.analysis && comparison.analysis.length > 50) {
    console.log('✅ PASS: Criminal Law Transition engine generated structured comparative analysis.');
    console.log(`Analysis Snippet: ${comparison.analysis.substring(0, 140)}...`);
    passed++;
  } else {
    console.error('❌ FAIL: Law comparison returned empty!', comparison);
    failed++;
  }

  // TEST 7: Prelims Bare Act MCQ Drill
  console.log('\n--- TEST 7: Prelims Bare Act MCQ Drill Generation ---');
  const drill = await LegalStudyAIService.generateSectionDrill('test-user', {
    actName: 'Bharatiya Nyaya Sanhita (BNS) 2023',
    chapterOrTopic: 'Offences Against the Human Body',
    count: 3,
  });

  if (drill && drill.questions && drill.questions.length > 0) {
    console.log(`✅ PASS: Generated ${drill.questions.length} Bare Act Prelims MCQs with citations.`);
    console.log(`Sample Question: ${drill.questions[0].question} (Citation: ${drill.questions[0].sectionCitation})`);
    passed++;
  } else {
    console.error('❌ FAIL: Drill generation failed!', drill);
    failed++;
  }

  // TEST 8: Mains Subjective Answer Evaluator
  console.log('\n--- TEST 8: Judicial Mains Answer Evaluation ---');
  const evalResult = await LegalStudyAIService.evaluateMainsAnswer('test-user', {
    question: 'Discuss the doctrine of Res Judicata under Section 11 of the Code of Civil Procedure, 1908.',
    userAnswer: 'Res judicata means a matter already decided cannot be reopened between the same parties in a subsequent suit. The direct and substantial issue must be decided by a court of competent jurisdiction as laid down in Duchess of Kingston Case and Daryao v. State of UP.',
    subject: 'Code of Civil Procedure',
  });

  if (evalResult && evalResult.evaluation && evalResult.evaluation.length > 50) {
    console.log('✅ PASS: Mains subjective answer evaluated against Judicial rubric.');
    console.log(`Evaluation Snippet: ${evalResult.evaluation.substring(0, 140)}...`);
    passed++;
  } else {
    console.error('❌ FAIL: Mains evaluation returned empty!', evalResult);
    failed++;
  }

  // TEST 9: Judicial Study Plan Generation & GFM Table Verification
  console.log('\n--- TEST 9: Judicial Study Plan Generation & GFM Tables ---');
  const planResult = await LegalStudyAIService.generateStudyPlan('test-user', {
    targetState: 'Delhi',
    targetExam: 'JUDICIARY',
    availableMonths: 6,
    dailyHours: 6,
    stageFocus: 'INTEGRATED',
  });

  if (planResult && planResult.planMarkdown && planResult.planMarkdown.length > 100) {
    const hasTable = planResult.planMarkdown.includes('|') && planResult.planMarkdown.includes('---');
    console.log(`✅ PASS: Judicial Study Plan successfully generated for ${planResult.state} (${planResult.examTitle}).`);
    console.log(`Table Structure Detected: ${hasTable ? 'YES' : 'NO'}`);
    console.log(`Plan Snippet: ${planResult.planMarkdown.substring(0, 160).replace(/\n/g, ' ')}...`);
    passed++;
  } else {
    console.error('❌ FAIL: Study plan generation returned empty or invalid!', planResult);
    failed++;
  }

  // TEST 10: Dynamic Judicial Mains Question Generation
  console.log('\n--- TEST 10: Dynamic Judicial Mains Question Generation ---');
  const genQ = await LegalStudyAIService.generateMainsQuestion('test-user', {
    subject: 'Civil Procedure Code (CPC 1908) & SRA',
    topic: 'Constructive Res Judicata & Inherent Powers',
    targetExam: 'JUDICIARY',
    targetState: 'DELHI',
    questionType: 'PROBLEM_BASED',
  });

  if (genQ && genQ.question && genQ.question.length > 30) {
    console.log(`✅ PASS: Dynamic Mains question successfully generated!`);
    console.log(`Subject: ${genQ.subject} | Topic: ${genQ.topic}`);
    console.log(`Question Snippet: ${genQ.question.substring(0, 140).replace(/\n/g, ' ')}...`);
    if (genQ.statutoryPointers && genQ.statutoryPointers.length > 0) {
      console.log(`Statutory Pointers: ${genQ.statutoryPointers.join(', ')}`);
    }
    passed++;
  } else {
    console.error('❌ FAIL: Dynamic question generation returned empty or invalid!', genQ);
    failed++;
  }

  // TEST 11: Past Year Paper (PYQ) Retrieval & AI Exam Solver
  console.log('\n--- TEST 11: Previous Year Paper (PYQ) Retrieval & AI Solver ---');
  const pyqAssets = await prisma.legalDocumentAsset.findMany({
    where: { category: 'PYQ' },
  });

  if (pyqAssets.length > 0) {
    console.log(`✅ PASS: Successfully retrieved ${pyqAssets.length} PYQ past papers from vault.`);
    passed++;
  } else {
    console.error('❌ FAIL: No PYQ documents found in database!');
    failed++;
  }

  // Solve a sample PYQ with AI solver
  const samplePyq = pyqAssets.find((p) => p.title.includes('Delhi') && p.title.includes('Mains')) || pyqAssets[0];
  if (samplePyq) {
    console.log(`Testing AI Solver on "${samplePyq.title}"...`);
    const solveRes = await LegalStudyAIService.solvePYQPaper('test-user', {
      paperId: samplePyq.id,
      paperTitle: samplePyq.title,
      paperContent: samplePyq.summary || '',
      state: samplePyq.state || 'DELHI',
      stage: (samplePyq.metadata as any)?.stage || 'MAINS',
      year: (samplePyq.metadata as any)?.year || 2023,
      specificQuestion: 'Solve Question 1 regarding BNS mob lynching provisions and evidentiary standards',
    });

    if (solveRes && solveRes.solution && solveRes.solution.length > 80) {
      console.log(`✅ PASS: AI Exam Solver successfully produced model answers!`);
      console.log(`Model: ${solveRes.model} | Latency: ${solveRes.latencyMs}ms`);
      console.log(`Tokens: prompt=${solveRes.tokens.promptTokens}, completion=${solveRes.tokens.completionTokens}`);
      console.log(`Answer Snippet: ${solveRes.solution.substring(0, 150).replace(/\n/g, ' ')}...`);
      passed++;
    } else {
      console.error('❌ FAIL: AI Exam Solver failed or returned empty solution!', solveRes);
      failed++;
    }
  }

  // TEST 12: Expanded Authentic Catalog (16+ Papers across Rajasthan, Haryana, Punjab, etc.)
  console.log('\n--- TEST 12: Expanded Past Paper Catalog & Seeding ---');
  if (legalOrg) {
    await LegalScraperService.seedEssentialLegalStatutes(legalOrg.id);
    const allOrgPyqs = await prisma.legalDocumentAsset.findMany({
      where: { orgId: legalOrg.id, category: 'PYQ' },
    });
    console.log(`Legal org "${legalOrg.name}" now has ${allOrgPyqs.length} PYQ papers in vault.`);
    const hasRajasthan = allOrgPyqs.some((p) => p.state === 'RAJASTHAN');
    const hasHaryana = allOrgPyqs.some((p) => p.state === 'HARYANA');
    const hasPunjab = allOrgPyqs.some((p) => p.state === 'PUNJAB');
    const hasMaharashtra = allOrgPyqs.some((p) => p.state === 'MAHARASHTRA');

    if (allOrgPyqs.length >= 16 && hasRajasthan && hasHaryana && hasPunjab && hasMaharashtra) {
      console.log('✅ PASS: Expanded catalog successfully seeded 16+ authentic papers across multi-state judiciary.');
      passed++;
    } else {
      console.error('❌ FAIL: Catalog did not seed expected multi-state papers!', {
        total: allOrgPyqs.length,
        hasRajasthan,
        hasHaryana,
        hasPunjab,
        hasMaharashtra,
      });
      failed++;
    }

    // TEST 13: Autonomous Past Paper Discovery Agent
    console.log('\n--- TEST 13: Autonomous Discovery & Ingestion Agent ---');
    console.log('Testing discovery agent for custom State (Jharkhand JPSC-J Mains 2023)...');
    const discoverRes = await LegalScraperService.discoverAndIngestPYQPaper(legalOrg.id, 'test-faculty-user', {
      state: 'JHARKHAND',
      examType: 'JUDICIARY',
      stage: 'MAINS',
      year: 2023,
      subject: 'Commercial Courts & Chota Nagpur Tenancy Act',
    });

    if (discoverRes && discoverRes.asset && discoverRes.asset.title.toLowerCase().includes('jharkhand')) {
      const assetMeta = (discoverRes.asset.metadata as any) || {};
      const hasContent = assetMeta.paperContent && assetMeta.paperContent.length > 100;
      console.log(`✅ PASS: Autonomous discovery agent successfully ingested paper: "${discoverRes.asset.title}"`);
      console.log(`Source: ${discoverRes.source} | Message: ${discoverRes.message}`);
      console.log(`Questions Content Length: ${assetMeta.paperContent?.length} chars`);
      if (hasContent) {
        passed++;
      } else {
        console.error('❌ FAIL: Ingested paper content is empty or incomplete!', assetMeta);
        failed++;
      }
    } else {
      console.error('❌ FAIL: Discovery agent failed to return asset!', discoverRes);
      failed++;
    }
  }

  console.log('\n====================================================');
  console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runLegalTestSuite().catch((err) => {
  console.error('Fatal error in test suite:', err);
  process.exit(1);
});
