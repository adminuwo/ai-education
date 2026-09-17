import React, { useState, useEffect, useCallback } from 'react';
import {
  Scale,
  BookOpen,
  Sparkles,
  Download,
  Upload,
  Bot,
  Search,
  FileText,
  CheckCircle2,
  HelpCircle,
  Clock,
  ArrowRight,
  Filter,
  Layers,
  Compass,
  Award,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Plus,
  Copy,
  Shuffle,
  Dices,
  Lightbulb,
  RotateCcw,
  FileQuestion,
  Eraser,
  Calendar,
  ListOrdered,
  Eye,
  BookMarked,
  Send
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { legalApi } from '@/lib/api';
import FormattedMarkdown from '@/components/FormattedMarkdown';

const PRESET_TRANSITION_QUERIES = [
  { label: 'Murder & Mob Lynching', query: 'IPC Section 300/302 vs BNS Section 100/101/103' },
  { label: 'Anticipatory Bail', query: 'CrPC Section 438 vs BNSS Section 482' },
  { label: 'Electronic Records Evidence', query: 'Indian Evidence Act Section 65B vs BSA Section 63' },
  { label: 'Audio-Video Seizure Recording', query: 'BNSS Section 105 mandatory electronic videography of search and seizure' },
  { label: 'Zero FIR Nationwide', query: 'BNSS Section 173 Zero FIR and electronic FIR reporting timeline' },
  { label: 'Acts Endangering Sovereignty', query: 'Sedition IPC 124A repeal vs BNS Section 152' },
];

export const LEGAL_MAINS_SUBJECTS = [
  { id: 'ALL', name: 'All Core Law Subjects' },
  { id: 'CRIMINAL', name: 'Criminal Law & Procedure (BNS & BNSS 2023)' },
  { id: 'CPC', name: 'Civil Procedure Code (CPC 1908) & SRA' },
  { id: 'CONSTI', name: 'Constitutional & Administrative Law' },
  { id: 'EVIDENCE', name: 'Law of Evidence (BSA 2023 / IEA)' },
  { id: 'CONTRACT', name: 'Law of Contracts & Commercial Law' },
  { id: 'PROPERTY', name: 'Transfer of Property Act (TPA 1882)' },
  { id: 'FAMILY', name: 'Family Law (Hindu & Muslim Law)' },
  { id: 'LOCAL', name: 'State Local Laws & Rent Control Acts' },
];

export const SAMPLE_MAINS_QUESTIONS = [
  {
    subject: 'Criminal Law & Procedure (BNS & BNSS 2023)',
    topic: 'Mob Lynching & Murder under BNS',
    source: 'Delhi DJS & UP PCS-J 2024 Model',
    marks: 20,
    statutoryPointers: ['Section 103(2) BNS 2023', 'Common Intention Section 3(5) BNS', 'Burden of Proof Section 104 BSA'],
    question: 'Discuss the statutory changes introduced in the Bharatiya Nyaya Sanhita, 2023 regarding the offence of murder by five or more persons acting in concert on grounds of caste, community, or religion (Mob Lynching). How does Section 103(2) alter the erstwhile requirements of Section 300/302 read with Section 149 of IPC, and what is the prescribed sentencing discretion?',
  },
  {
    subject: 'Civil Procedure Code (CPC 1908) & SRA',
    topic: 'Res Judicata & Explanation IV',
    source: 'Delhi Judicial Service (DJS) Mains',
    marks: 20,
    statutoryPointers: ['Section 11 CPC', 'Explanation IV (Constructive Res Judicata)', 'Daryao v. State of UP', 'State of UP v. Nawab Hussain'],
    question: 'Explain the doctrine of Res Judicata under Section 11 of the Code of Civil Procedure, 1908. Distinguish between actual Res Judicata and Constructive Res Judicata with leading case illustrations. Does constructive res judicata apply to writ petitions under Article 32 and Article 226 of the Constitution?',
  },
  {
    subject: 'Constitutional & Administrative Law',
    topic: 'Writ Jurisdiction & Certiorari Grounds',
    source: 'UP PCS-J & Bihar BPSC-J',
    marks: 20,
    statutoryPointers: ['Articles 32 & 226', 'Writ of Certiorari', 'Errors of Law Apparent on Face', 'Syed Yakoob v. K.S. Radhakrishnan'],
    question: 'Critically analyze the scope of Judicial Review of administrative actions under Articles 32 and 226 of the Constitution of India. What are the grounds on which a writ of Certiorari may be issued against a quasi-judicial body? Can the High Court substitute its own findings of fact for those of an administrative tribunal?',
  },
  {
    subject: 'Law of Evidence (BSA 2023 / IEA)',
    topic: 'Electronic Records & Certificate Mandatory Admissibility',
    source: 'All-India Judicial Services 2024',
    marks: 20,
    statutoryPointers: ['Section 63 BSA 2023', 'Section 61 BSA', 'Arjun Panditrao Khotkar v. Kailash Kushanrao Gorantyal (2020)'],
    question: 'How has the Bharatiya Sakshya Adhiniyam, 2023 revised the admissibility of electronic records in judicial proceedings? Examine the statutory requirements under Section 63 of BSA 2023 in light of the landmark Supreme Court ruling in Arjun Panditrao Khotkar. Is an electronic certificate mandatory when secondary digital evidence is produced from a seized phone or laptop?',
  },
  {
    subject: 'Criminal Law & Procedure (BNS & BNSS 2023)',
    topic: 'Police Custody & Staggered Remand Timeline',
    source: 'Rajasthan RJS & Haryana HCS(JB)',
    marks: 20,
    statutoryPointers: ['Section 187 BNSS 2023 vs Section 167 CrPC', '15-day custody dispersal in 40/60 days', 'Default Bail Section 187(3)'],
    question: 'Critically examine the provisions relating to detention in police custody and judicial remand under Section 187 of the Bharatiya Nagarik Suraksha Sanhita, 2023 compared to Section 167 of the erstwhile CrPC, 1973. Discuss whether the 15-day police custody can now be sought in staggered periods beyond the initial 15 days of arrest, and analyze its constitutional implications under Article 21.',
  },
  {
    subject: 'Civil Procedure Code (CPC 1908) & SRA',
    topic: 'Inherent Powers & Restitution Maxim',
    source: 'Delhi DJS & Punjab PCS(JB)',
    marks: 20,
    statutoryPointers: ['Section 144 CPC (Restitution)', 'Section 151 CPC (Inherent Powers)', 'Kavita Trehan v. Balsara Hygiene', 'Actus curiae neminem gravabit'],
    question: 'Explain the scope of Section 144 of the Code of Civil Procedure, 1908 regarding restitution. Can a civil court order restitution in exercise of its inherent powers under Section 151 CPC where a case does not strictly fall within the four corners of Section 144? Discuss the maxim "Actus curiae neminem gravabit" with case laws.',
  },
  {
    subject: 'Law of Contracts & Commercial Law',
    topic: 'Frustration of Contract vs Express Force Majeure',
    source: 'UP PCS-J & MP Civil Judge',
    marks: 20,
    statutoryPointers: ['Section 56 Contract Act', 'Section 32 (Contingent Contracts)', 'Satyabrata Ghose v. Mugneeram Bangur', 'Energy Watchdog v. CERC (2017)'],
    question: 'Discuss the doctrine of frustration of contract under Section 56 of the Indian Contract Act, 1872. Distinguish between statutory frustration by subsequent impossibility and the operation of an express Force Majeure clause under Section 32, with specific reference to Energy Watchdog v. CERC (2017).',
  },
  {
    subject: 'Transfer of Property Act (TPA 1882)',
    topic: 'Part Performance Shield vs Title Sword',
    source: 'Bihar BPSC-J & MP CJ',
    marks: 20,
    statutoryPointers: ['Section 53A TPA 1882', 'Registration Act Section 17(1A)', 'Shield not sword doctrine', 'Shrimant Shamrao Suryavanshi v. Prahlad'],
    question: 'Explain the essential elements required to invoke the defense of Part Performance under Section 53A of the Transfer of Property Act, 1882. What is the impact of the 2001 amendment to Section 17(1A) of the Registration Act on an unregistered agreement to sell? Can Section 53A be used as an offensive weapon to declare ownership title?',
  },
  {
    subject: 'Criminal Law & Procedure (BNS & BNSS 2023)',
    topic: 'Zero FIR & Statutory Arrest Safeguards',
    source: 'Delhi DJS & Higher Judiciary (HJS)',
    marks: 20,
    statutoryPointers: ['Section 173 BNSS (Zero FIR)', 'Section 35 BNSS (Arrest)', 'Arnesh Kumar v. State of Bihar', 'Notice of Appearance'],
    question: 'Analyze the statutory entrenchment of "Zero FIR" under Section 173 of the Bharatiya Nagarik Suraksha Sanhita, 2023. What are the legal duties of the officer-in-charge of a police station when information regarding a cognizable offence committed outside territorial limits is received? What safeguards are enacted for arrest of persons punishable with imprisonment up to 7 years?',
  },
  {
    subject: 'Family Law (Hindu & Muslim Law)',
    topic: 'Coparcenary Rights of Daughters Retroactivity',
    source: 'UP PCS-J & Delhi DJS',
    marks: 20,
    statutoryPointers: ['Section 6 Hindu Succession Act 1956', 'Vineeta Sharma v. Rakesh Sharma (2020)', 'Coparcener by birth antecedent rights'],
    question: 'Examine the nature and extent of coparcenary rights conferred upon daughters by the Hindu Succession (Amendment) Act, 2005. Discuss the landmark three-judge bench decision of the Supreme Court in Vineeta Sharma v. Rakesh Sharma (2020) regarding whether the father coparcener was required to be living as of September 9, 2005.',
  },
  {
    subject: 'Civil Procedure Code (CPC 1908) & SRA',
    topic: 'Mandatory Specific Performance & Readiness Pleading',
    source: 'Delhi DJS & Rajasthan RJS',
    marks: 20,
    statutoryPointers: ['Section 10 SRA (2018 Amendment)', 'Section 16(c) SRA', 'Readiness & Willingness Continuous Proof', 'Kamal Kumar v. Premlata Joshi'],
    question: 'Prior to the Specific Relief (Amendment) Act, 2018, specific performance of a contract was discretionary. Analyze the statutory shift brought by Section 10 making specific performance mandatory. Does the plaintiff still have to plead and prove continuous "readiness and willingness" under Section 16(c)? Discuss with recent precedents.',
  },
  {
    subject: 'State Local Laws & Rent Control Acts',
    topic: 'Bonafide Requirement for Eviction',
    source: 'Delhi DJS & UP PCS-J',
    marks: 20,
    statutoryPointers: ['Delhi Rent Control Act Section 14(1)(e)', 'UP Urban Buildings Act Section 21(1)(a)', 'Satyawati Sharma v. Union of India', 'Comparative Hardship doctrine'],
    question: 'Discuss the grounds of eviction on the premise of "bonafide requirement" of the landlord under the Delhi Rent Control Act, 1958 and the UP Urban Buildings (Regulation of Letting, Rent and Eviction) Act, 1972. How did the Supreme Court judgment in Satyawati Sharma v. Union of India eliminate the dichotomy between commercial and residential premises?',
  },
];

export const STATE_JUDICIARY_EXAMS = [
  { value: 'DELHI', label: 'Delhi (DJS - High Analytical & Commercial Courts)', stateName: 'Delhi' },
  { value: 'UP', label: 'Uttar Pradesh (UP PCS-J - Local Revenue & Tenancy Acts)', stateName: 'Uttar Pradesh' },
  { value: 'MP', label: 'Madhya Pradesh (MP CJ - Bare Act Precision & Accommodation Control)', stateName: 'Madhya Pradesh' },
  { value: 'BIHAR', label: 'Bihar (BPSC-J - Procedure, Specific Relief & General Law)', stateName: 'Bihar' },
  { value: 'RAJASTHAN', label: 'Rajasthan (RJS - Civil, Rent Laws & Local Panchayati Acts)', stateName: 'Rajasthan' },
  { value: 'HARYANA', label: 'Haryana (HCS Judicial Branch - Urban Rent & Customary Laws)', stateName: 'Haryana' },
  { value: 'PUNJAB', label: 'Punjab (PCS Judicial Branch - Punjab Courts Act & Rent)', stateName: 'Punjab' },
  { value: 'MAHARASHTRA', label: 'Maharashtra (Bombay HC JMFC - Rent Control & Land Revenue)', stateName: 'Maharashtra' },
  { value: 'GUJARAT', label: 'Gujarat (Gujarat HC GJS - Civil Judge & Land Tenure)', stateName: 'Gujarat' },
  { value: 'WEST_BENGAL', label: 'West Bengal (WBJS - WB Premises Tenancy & Land Reforms)', stateName: 'West Bengal' },
  { value: 'UTTARAKHAND', label: 'Uttarakhand (UKPSC-J - Zamindari Abolition & Revenue Acts)', stateName: 'Uttarakhand' },
  { value: 'HIMACHAL', label: 'Himachal Pradesh (HPJS - HP Courts Act & Urban Rent Control)', stateName: 'Himachal Pradesh' },
  { value: 'JHARKHAND', label: 'Jharkhand (JPSC-J - CNT & SPT Chota Nagpur Tenancy Acts)', stateName: 'Jharkhand' },
  { value: 'CHHATTISGARH', label: 'Chhattisgarh (CGPSC-J - CG Rent Control & Excise Acts)', stateName: 'Chhattisgarh' },
  { value: 'ODISHA', label: 'Odisha (OJS - Odisha House Rent Control & Land Reforms)', stateName: 'Odisha' },
  { value: 'KARNATAKA', label: 'Karnataka (Karnataka HC Civil Judge - Rent & Land Revenue)', stateName: 'Karnataka' },
  { value: 'TAMIL_NADU', label: 'Tamil Nadu (TNPSC-J - Buildings Lease & Rent Control)', stateName: 'Tamil Nadu' },
  { value: 'KERALA', label: 'Kerala (Kerala HC Civil Judge - Buildings Lease & Rent Control)', stateName: 'Kerala' },
  { value: 'TELANGANA', label: 'Telangana (TSJS - Civil Judge & Land Acquisition / Tenancy)', stateName: 'Telangana' },
  { value: 'ANDHRA', label: 'Andhra Pradesh (APJS - Civil Judge & Buildings Tenancy)', stateName: 'Andhra Pradesh' },
  { value: 'ASSAM', label: 'Assam & North East (Gauhati HC AJS - Assam Urban Areas Rent)', stateName: 'Assam' },
  { value: 'JAMMU_KASHMIR', label: 'Jammu & Kashmir (JKPSC-J - Civil Judge & Local Acts)', stateName: 'Jammu & Kashmir' },
  { value: 'GOA', label: 'Goa (Bombay HC Goa JMFC - Buildings Lease & Rent Control)', stateName: 'Goa' },
  { value: 'TRIPURA', label: 'Tripura (Tripura HC TJS - Land Revenue & Tenancy)', stateName: 'Tripura' },
  { value: 'MANIPUR', label: 'Manipur (Manipur HC MJS - Civil Judge & Local Customs)', stateName: 'Manipur' },
  { value: 'MEGHALAYA', label: 'Meghalaya (Meghalaya HC MJS - Autonomous District Council Laws)', stateName: 'Meghalaya' },
  { value: 'SIKKIM', label: 'Sikkim (Sikkim HC SJS - Civil Judge Cadre & Local Laws)', stateName: 'Sikkim' },
  { value: 'ARUNACHAL', label: 'Arunachal Pradesh (Gauhati HC APJS - Customary Laws & Civil Courts)', stateName: 'Arunachal Pradesh' },
  { value: 'MIZORAM', label: 'Mizoram (Gauhati HC MJS - Civil Judge Cadre)', stateName: 'Mizoram' },
  { value: 'NAGALAND', label: 'Nagaland (Gauhati HC NJS - Customary Law & Civil Procedure)', stateName: 'Nagaland' },
];

export const LEGAL_EXAM_STREAMS = [
  { value: 'JUDICIARY', label: 'Judicial Magistrate / Civil Judge (Junior Division / PCS-J)', shortName: 'Civil Judge / PCS-J' },
  { value: 'HJS', label: 'Higher Judicial Services (HJS / Direct District Judge)', shortName: 'Higher Judiciary (HJS)' },
  { value: 'ADP', label: 'Assistant Public Prosecutor (ADP / APO / APP / ADPO)', shortName: 'Prosecutor (ADP / APO)' },
  { value: 'BOTH', label: 'Dual Preparation (Civil Judge & Public Prosecutor)', shortName: 'Dual (Judge & Prosecutor)' },
  { value: 'JAG', label: 'Judge Advocate General (JAG - Indian Armed Forces Legal Branch)', shortName: 'Army JAG Corps' },
  { value: 'SEBI_LEGAL', label: 'SEBI Grade A Officer (Legal Stream - Securities & Corporate)', shortName: 'SEBI Legal Officer' },
  { value: 'IBPS_SO_LAW', label: 'IBPS SO / RBI Grade B (Bank Law Officer Scale I & II)', shortName: 'Bank Law Officer' },
  { value: 'UGC_NET_LAW', label: 'UGC-NET / JRF (Law - Assistant Professor & Academic Fellowship)', shortName: 'UGC-NET / JRF (Law)' },
  { value: 'CLAT_PG', label: 'CLAT PG / AILET PG (LL.M Entrance & PSU Legal Recruitment)', shortName: 'CLAT PG / LL.M' },
  { value: 'PSU_LEGAL', label: 'PSU In-House Law Officer (ONGC, IOCL, NTPC, BHEL, PowerGrid)', shortName: 'PSU Law Officer' },
];

export default function LegalStudyHubTab({ currentOrg, user }) {
  const [activeSubTab, setActiveSubTab] = useState('library'); // library, planner, transition, mains, drill

  // Library State
  const [assets, setAssets] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [examFilter, setExamFilter] = useState('ALL');
  const [stateFilter, setStateFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Scraper Modal State
  const [scraperModalOpen, setScraperModalOpen] = useState(false);
  const [scraperQuery, setScraperQuery] = useState('');
  const [scraperSource, setScraperSource] = useState('INDIA_CODE');
  const [scraperRunning, setScraperRunning] = useState(false);
  const [scraperJobs, setScraperJobs] = useState([]);

  // Upload Book Modal State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('BOOK_COMMENTARY');
  const [uploadExam, setUploadExam] = useState('BOTH');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Planner State
  const [planState, setPlanState] = useState('DELHI');
  const [planExam, setPlanExam] = useState('JUDICIARY');
  const [planMonths, setPlanMonths] = useState(6);
  const [planHours, setPlanHours] = useState(6);
  const [planResult, setPlanResult] = useState(null);
  const [generatingPlan, setGeneratingPlan] = useState(false);

  // Transition State
  const [transQuery, setTransQuery] = useState('IPC Section 302 vs BNS Section 103');
  const [transResult, setTransResult] = useState(null);
  const [loadingTrans, setLoadingTrans] = useState(false);

  // Mains Evaluator State
  const [mainsQuestion, setMainsQuestion] = useState(SAMPLE_MAINS_QUESTIONS[0].question);
  const [mainsAnswer, setMainsAnswer] = useState('');
  const [mainsSubject, setMainsSubject] = useState(SAMPLE_MAINS_QUESTIONS[0].subject);
  const [mainsEvaluation, setMainsEvaluation] = useState(null);
  const [evaluatingMains, setEvaluatingMains] = useState(false);
  const [mainsSubjectFilter, setMainsSubjectFilter] = useState('ALL');
  const [mainsTopicInput, setMainsTopicInput] = useState('');
  const [mainsQuestionType, setMainsQuestionType] = useState('PROBLEM_BASED');
  const [generatingQuestion, setGeneratingQuestion] = useState(false);
  const [activeQuestionMeta, setActiveQuestionMeta] = useState({
    topic: SAMPLE_MAINS_QUESTIONS[0].topic,
    source: SAMPLE_MAINS_QUESTIONS[0].source,
    marks: SAMPLE_MAINS_QUESTIONS[0].marks,
    statutoryPointers: SAMPLE_MAINS_QUESTIONS[0].statutoryPointers,
  });

  // PYQ State
  const [pyqAssets, setPyqAssets] = useState([]);
  const [loadingPyqs, setLoadingPyqs] = useState(false);
  const [pyqSearch, setPyqSearch] = useState('');
  const [pyqStateFilter, setPyqStateFilter] = useState('ALL');
  const [pyqExamFilter, setPyqExamFilter] = useState('ALL');
  const [pyqStageFilter, setPyqStageFilter] = useState('ALL');
  const [pyqYearFilter, setPyqYearFilter] = useState('ALL');
  const [selectedPyqPaper, setSelectedPyqPaper] = useState(null);
  const [pyqModalOpen, setPyqModalOpen] = useState(false);
  const [pyqSolverOpen, setPyqSolverOpen] = useState(false);
  const [solvingPyq, setSolvingPyq] = useState(false);
  const [pyqSolutionResult, setPyqSolutionResult] = useState(null);
  const [pyqSpecificQuestion, setPyqSpecificQuestion] = useState('');

  // Fetch Past Year Papers specifically
  const fetchPyqs = useCallback(async () => {
    setLoadingPyqs(true);
    try {
      const res = await legalApi.getLibrary({ category: 'PYQ' });
      setPyqAssets(Array.isArray(res.assets) ? res.assets : []);
    } catch (e) {
      console.error('Failed to load PYQ library', e);
    } finally {
      setLoadingPyqs(false);
    }
  }, []);

  // Section Drill State
  const [drillAct, setDrillAct] = useState('Bharatiya Nyaya Sanhita (BNS) 2023');
  const [drillTopic, setDrillTopic] = useState('Offences Against Human Body');
  const [drillQuestions, setDrillQuestions] = useState([]);
  const [loadingDrill, setLoadingDrill] = useState(false);
  const [userAnswers, setUserAnswers] = useState({});
  const [submittedDrill, setSubmittedDrill] = useState(false);

  // Load Library Assets
  const fetchLibrary = useCallback(async () => {
    setLoadingAssets(true);
    try {
      const res = await legalApi.getLibrary({
        category: categoryFilter,
        targetExams: examFilter,
        state: stateFilter,
        search: searchQuery,
      });
      setAssets(Array.isArray(res.assets) ? res.assets : []);
    } catch (err) {
      toast.error('Failed to load legal document library');
    } finally {
      setLoadingAssets(false);
    }
  }, [categoryFilter, examFilter, stateFilter, searchQuery]);

  // Load Scraper Jobs
  const fetchScraperJobs = useCallback(async () => {
    try {
      const res = await legalApi.getScraperJobs();
      setScraperJobs(Array.isArray(res.jobs) ? res.jobs : []);
    } catch (e) {}
  }, []);

  useEffect(() => {
    fetchLibrary();
    fetchPyqs();
    fetchScraperJobs();
  }, [fetchLibrary, fetchPyqs, fetchScraperJobs]);

  // Trigger Scraper
  const handleRunScraper = async (e) => {
    e.preventDefault();
    if (!scraperQuery.trim()) {
      toast.error('Please enter a statute or topic to scrape');
      return;
    }
    setScraperRunning(true);
    try {
      await legalApi.runScraper({
        searchQuery: scraperQuery.trim(),
        targetSource: scraperSource,
        category: 'BARE_ACT',
        targetExams: 'BOTH',
      });
      toast.success(`Autonomous Scraper Agent dispatched for "${scraperQuery}"!`);
      setScraperModalOpen(false);
      setScraperQuery('');
      fetchScraperJobs();
      setTimeout(() => {
        fetchLibrary();
        fetchPyqs();
      }, 2500);
    } catch (err) {
      toast.error('Failed to launch scraper agent');
    } finally {
      setScraperRunning(false);
    }
  };

  // Upload Book / Notes
  const handleUploadBook = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      toast.error('Please select a file to upload');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('title', uploadTitle || uploadFile.name);
      formData.append('category', uploadCategory);
      formData.append('targetExams', uploadExam);

      await legalApi.uploadAsset(formData);
      toast.success('Document uploaded to cloud storage and indexed!');
      setUploadModalOpen(false);
      setUploadFile(null);
      setUploadTitle('');
      fetchLibrary();
      fetchPyqs();
    } catch (err) {
      toast.error('Upload failed. Check file format and size.');
    } finally {
      setUploading(false);
    }
  };

  // Generate Plan
  const handleGeneratePlan = async () => {
    setGeneratingPlan(true);
    try {
      const res = await legalApi.generateStudyPlan({
        targetExam: planExam,
        targetState: planState,
        availableMonths: planMonths,
        dailyHours: planHours,
      });
      setPlanResult(res);
      toast.success('Judicial / ADP Roadmap Generated!');
    } catch (err) {
      toast.error('Failed to synthesize study plan');
    } finally {
      setGeneratingPlan(false);
    }
  };

  // Compare Law
  const handleCompareLaw = async (customQ) => {
    const q = customQ || transQuery;
    if (!q.trim()) return;
    setLoadingTrans(true);
    try {
      const res = await legalApi.compareCriminalLaws({ query: q.trim() });
      setTransResult(res);
    } catch (err) {
      toast.error('Comparison engine error');
    } finally {
      setLoadingTrans(false);
    }
  };

  // Generate Fresh Mains Question on demand
  const handleGenerateQuestion = async () => {
    const subjectToSend = mainsSubjectFilter === 'ALL' ? 'Criminal Law & Procedure (BNS & BNSS 2023)' : mainsSubjectFilter;
    setGeneratingQuestion(true);
    try {
      const res = await legalApi.generateMainsQuestion({
        subject: subjectToSend,
        topic: mainsTopicInput.trim() || undefined,
        targetExam: planExam,
        targetState: planState,
        questionType: mainsQuestionType,
      });
      if (res && res.question) {
        setMainsQuestion(res.question);
        setMainsSubject(res.subject || subjectToSend);
        setActiveQuestionMeta({
          topic: res.topic || 'Substantive & Procedural Law',
          source: `AI Generated (${res.targetState || planState} Judicial Standard)`,
          marks: res.marks || 20,
          suggestedTimeMinutes: res.suggestedTimeMinutes || 25,
          statutoryPointers: res.statutoryPointers || [],
          modelAnswerOutline: res.modelAnswerOutline,
        });
        setMainsEvaluation(null);
        toast.success(`✨ Fresh ${mainsQuestionType === 'PROBLEM_BASED' ? 'Problem Scenario' : 'Mains Question'} Generated!`);
      }
    } catch (err) {
      toast.error('Failed to generate question. Please try again.');
    } finally {
      setGeneratingQuestion(false);
    }
  };

  const handleSelectSampleQuestion = (questionText) => {
    const found = SAMPLE_MAINS_QUESTIONS.find((q) => q.question === questionText);
    if (found) {
      setMainsQuestion(found.question);
      setMainsSubject(found.subject);
      setActiveQuestionMeta({
        topic: found.topic,
        source: found.source,
        marks: found.marks || 20,
        statutoryPointers: found.statutoryPointers || [],
      });
      setMainsEvaluation(null);
      toast.info(`Loaded: ${found.topic}`);
    }
  };

  const handleRollRandomQuestion = () => {
    const pool = mainsSubjectFilter === 'ALL'
      ? SAMPLE_MAINS_QUESTIONS
      : SAMPLE_MAINS_QUESTIONS.filter((q) => q.subject.toLowerCase().includes(mainsSubjectFilter.toLowerCase()));
    const finalPool = pool.length > 0 ? pool : SAMPLE_MAINS_QUESTIONS;
    const randomIdx = Math.floor(Math.random() * finalPool.length);
    const sq = finalPool[randomIdx];
    handleSelectSampleQuestion(sq.question);
  };

  const filteredQuestions = mainsSubjectFilter === 'ALL'
    ? SAMPLE_MAINS_QUESTIONS
    : SAMPLE_MAINS_QUESTIONS.filter((q) =>
        q.subject.toLowerCase().includes(mainsSubjectFilter.toLowerCase()) ||
        mainsSubjectFilter.toLowerCase().includes(q.subject.toLowerCase())
      );

  // Evaluate Mains
  const handleEvaluateMains = async () => {
    if (!mainsQuestion.trim() || !mainsAnswer.trim()) {
      toast.error('Please provide both the question and your answer');
      return;
    }
    setEvaluatingMains(true);
    try {
      const res = await legalApi.evaluateMainsAnswer({
        question: mainsQuestion,
        userAnswer: mainsAnswer,
        subject: mainsSubject,
      });
      setMainsEvaluation(res);
      toast.success('Mains Answer Evaluated!');
    } catch (err) {
      toast.error('Evaluation request failed');
    } finally {
      setEvaluatingMains(false);
    }
  };

  // Generate Drill
  const handleGenerateDrill = async () => {
    setLoadingDrill(true);
    setSubmittedDrill(false);
    setUserAnswers({});
    try {
      const res = await legalApi.generateSectionDrill({
        actName: drillAct,
        chapterOrTopic: drillTopic,
        count: 5,
      });
      setDrillQuestions(res.questions || []);
      toast.success('Prelims Bare Act Drill Ready!');
    } catch (err) {
      toast.error('Failed to generate drill');
    } finally {
      setLoadingDrill(false);
    }
  };

  const getScore = () => {
    let correct = 0;
    drillQuestions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctIndex) correct++;
    });
    return correct;
  };

  // PYQ Filtering
  const filteredPyqs = pyqAssets.filter((asset) => {
    if (pyqSearch.trim()) {
      const q = pyqSearch.toLowerCase();
      const matchTitle = (asset.title || '').toLowerCase().includes(q);
      const matchContent = (asset.textContent || '').toLowerCase().includes(q);
      const matchSubject = (asset.metadata?.subject || '').toLowerCase().includes(q);
      if (!matchTitle && !matchContent && !matchSubject) return false;
    }
    if (pyqStateFilter !== 'ALL' && asset.state !== pyqStateFilter) return false;
    if (pyqExamFilter !== 'ALL' && asset.targetExams !== pyqExamFilter && asset.targetExams !== 'BOTH') return false;
    if (pyqStageFilter !== 'ALL') {
      const stage = asset.metadata?.stage || (asset.title.toLowerCase().includes('prelim') ? 'PRELIMS' : 'MAINS');
      if (stage !== pyqStageFilter) return false;
    }
    if (pyqYearFilter !== 'ALL') {
      const yr = String(asset.metadata?.year || '');
      if (yr !== pyqYearFilter) return false;
    }
    return true;
  });

  // AI Exam Solver handler
  const handleSolvePYQ = async (paperToSolve, specificQuestionText = '') => {
    const paper = paperToSolve || selectedPyqPaper;
    if (!paper) return;
    setSelectedPyqPaper(paper);
    setSolvingPyq(true);
    setPyqSolverOpen(true);
    try {
      const stage = paper.metadata?.stage || (paper.title.toLowerCase().includes('prelim') ? 'PRELIMS' : 'MAINS');
      const year = paper.metadata?.year || (paper.title.match(/20\d\d/) ? parseInt(paper.title.match(/20\d\d/)[0]) : 2023);
      const res = await legalApi.solvePYQPaper({
        paperId: paper.id,
        paperTitle: paper.title,
        paperContent: paper.metadata?.paperContent || paper.metadata?.fullText || paper.metadata?.snippet || paper.textContent || paper.summary || '',
        state: paper.state || 'DELHI',
        examType: paper.targetExams || 'CIVIL_JUDGE',
        stage: stage,
        year: year,
        specificQuestion: specificQuestionText || pyqSpecificQuestion,
      });
      setPyqSolutionResult(res);
      toast.success('AI Solution & Model Answers generated!');
    } catch (err) {
      toast.error('Failed to generate AI solution for past paper');
    } finally {
      setSolvingPyq(false);
    }
  };

  return (
    <div className="flex flex-col space-y-4 pb-8">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 border border-amber-500/20 rounded-xl gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-semibold text-white tracking-tight">
                Judicial Services (Civil Judge / PCS-J) & ADP Exam Hub
              </h2>
              <Badge variant="outline" className="bg-amber-500/10 text-amber-300 border-amber-500/30 text-xs">
                AI-Legal Enterprise
              </Badge>
            </div>
            <p className="text-xs text-slate-400">
              Official Open-Source Ingestion • BNS/BNSS/BSA Transition Engine • Mains Rubric Evaluator • Cloud Vault
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            onClick={() => setScraperModalOpen(true)}
            className="bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs shadow-md shadow-amber-950/50"
          >
            <Bot className="w-3.5 h-3.5 mr-1.5" />
            Autonomous Scraper
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setUploadModalOpen(true)}
            className="border-slate-700 hover:bg-slate-800 text-slate-200 text-xs"
          >
            <Upload className="w-3.5 h-3.5 mr-1.5" />
            Upload Book / Notes
          </Button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center space-x-1 border-b border-slate-800 pb-2 overflow-x-auto text-sm">
        <button
          onClick={() => setActiveSubTab('library')}
          className={`px-3 py-1.5 rounded-lg flex items-center space-x-2 transition-all text-xs font-medium ${
            activeSubTab === 'library'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Legal Vault & Books ({assets.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('transition')}
          className={`px-3 py-1.5 rounded-lg flex items-center space-x-2 transition-all text-xs font-medium ${
            activeSubTab === 'transition'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>New Criminal Laws (BNS/BNSS/BSA)</span>
        </button>
        <button
          onClick={() => setActiveSubTab('planner')}
          className={`px-3 py-1.5 rounded-lg flex items-center space-x-2 transition-all text-xs font-medium ${
            activeSubTab === 'planner'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>State Exam Blueprint</span>
        </button>
        <button
          onClick={() => setActiveSubTab('mains')}
          className={`px-3 py-1.5 rounded-lg flex items-center space-x-2 transition-all text-xs font-medium ${
            activeSubTab === 'mains'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Mains Answer Evaluator</span>
        </button>
        <button
          onClick={() => setActiveSubTab('drill')}
          className={`px-3 py-1.5 rounded-lg flex items-center space-x-2 transition-all text-xs font-medium ${
            activeSubTab === 'drill'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Prelims Bare Act Drills</span>
        </button>
        <button
          onClick={() => setActiveSubTab('pyq')}
          className={`px-3 py-1.5 rounded-lg flex items-center space-x-2 transition-all text-xs font-medium ${
            activeSubTab === 'pyq'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Past Papers & PYQs ({filteredPyqs.length})</span>
        </button>
      </div>

      {/* TAB 1: LEGAL VAULT & INGESTED BOOKS */}
      {activeSubTab === 'library' && (
        <div className="flex-1 flex flex-col space-y-3 min-h-0">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <Input
                placeholder="Search Bare Acts, PYQs, landmark rulings, notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-xs bg-slate-950/60 border-slate-700 h-8"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1 text-xs text-slate-300 h-8 focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              <option value="BARE_ACT">Bare Acts & Codes</option>
              <option value="SYLLABUS">Syllabus & Blueprint</option>
              <option value="PYQ">Past Papers (PYQs)</option>
              <option value="BOOK_COMMENTARY">Books & Notes</option>
              <option value="CASE_LAW">Case Laws</option>
            </select>

            <select
              value={examFilter}
              onChange={(e) => setExamFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1 text-xs text-slate-300 h-8 focus:outline-none"
            >
              <option value="ALL">All Legal Streams</option>
              {LEGAL_EXAM_STREAMS.map((e) => (
                <option key={e.value} value={e.value}>
                  {e.shortName}
                </option>
              ))}
            </select>

            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1 text-xs text-slate-300 h-8 focus:outline-none"
            >
              <option value="ALL">All States (Pan-India)</option>
              {STATE_JUDICIARY_EXAMS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.stateName}
                </option>
              ))}
            </select>

            <Button
              variant="ghost"
              size="sm"
              onClick={fetchLibrary}
              className="h-8 px-2 text-slate-400 hover:text-white"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Document Assets Grid */}
          <ScrollArea className="flex-1 rounded-lg border border-slate-800 bg-slate-950/40 p-3">
            {loadingAssets ? (
              <div className="flex items-center justify-center h-48 text-slate-500 text-xs">
                <RefreshCw className="w-4 h-4 mr-2 animate-spin text-amber-500" />
                Loading authoritative legal documents...
              </div>
            ) : assets.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center p-6">
                <BookOpen className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-sm font-medium text-slate-300">No documents found matching filters</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  Run the Autonomous Scraper Agent to discover Bare Acts from India Code or upload custom notes.
                </p>
                <Button
                  size="sm"
                  onClick={() => setScraperModalOpen(true)}
                  className="mt-3 bg-amber-600 hover:bg-amber-500 text-white text-xs"
                >
                  <Bot className="w-3 h-3 mr-1" />
                  Run Scraper Agent
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {assets.map((item) => (
                  <Card
                    key={item.id}
                    className="p-3.5 bg-slate-900/50 border-slate-800 hover:border-amber-500/30 transition-all flex flex-col justify-between space-y-2.5"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold text-slate-100 leading-tight">
                          {item.title}
                        </h3>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0.5 shrink-0 ${
                            item.category === 'BARE_ACT'
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                              : item.category === 'SYLLABUS'
                              ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                              : item.category === 'PYQ'
                              ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                              : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          {item.category.replace('_', ' ')}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        {item.targetExams && (
                          <Badge variant="secondary" className="text-[10px] bg-slate-800 text-slate-300 py-0">
                            {item.targetExams}
                          </Badge>
                        )}
                        {item.state && item.state !== 'ALL' && (
                          <Badge variant="secondary" className="text-[10px] bg-indigo-950/60 text-indigo-300 border border-indigo-800/40 py-0">
                            {item.state}
                          </Badge>
                        )}
                        {item.sectionCount > 0 && (
                          <span className="text-[11px] text-slate-400">
                            • {item.sectionCount} Sections
                          </span>
                        )}
                      </div>

                      {item.summary && (
                        <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                          {item.summary}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]">
                      <span className="text-slate-500 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>

                      <div className="flex items-center space-x-2">
                        {item.sourceUrl && (
                          <a
                            href={item.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-amber-400 inline-flex items-center"
                            title="Original Source Portal"
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Source
                          </a>
                        )}
                        <a
                          href={item.signedUrl || item.publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded text-xs font-medium inline-flex items-center transition-colors"
                        >
                          <Download className="w-3 h-3 mr-1 text-amber-400" />
                          View / Download
                        </a>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}

      {/* TAB 2: NEW CRIMINAL LAWS TRANSITION */}
      {activeSubTab === 'transition' && (
        <div className="flex-1 flex flex-col space-y-3 min-h-0">
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center">
                <RefreshCw className="w-4 h-4 mr-2 text-amber-400" />
                Criminal Laws Transformation Navigator (IPC/CrPC/IEA $\leftrightarrow$ BNS/BNSS/BSA)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Instant statutory cross-referencing, procedural mandates, audio-video electronic recording, and judicial exam hotspots.
              </p>
            </div>

            {/* Quick Query Chips */}
            <div className="flex flex-wrap gap-1.5">
              {PRESET_TRANSITION_QUERIES.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setTransQuery(item.query);
                    handleCompareLaw(item.query);
                  }}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-700/60 transition-colors"
                >
                  ⚡ {item.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="flex gap-2">
              <Input
                placeholder="Enter Section or Topic (e.g. IPC 420 vs BNS 318, CrPC 167 remand in BNSS 187, or Confessions)..."
                value={transQuery}
                onChange={(e) => setTransQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCompareLaw()}
                className="text-xs bg-slate-950 border-slate-700"
              />
              <Button
                onClick={() => handleCompareLaw()}
                disabled={loadingTrans}
                className="bg-amber-600 hover:bg-amber-500 text-white text-xs px-4"
              >
                {loadingTrans ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Compare'}
              </Button>
            </div>
          </div>

          {/* Results Box */}
          <ScrollArea className="flex-1 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            {loadingTrans ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-xs">
                <RefreshCw className="w-5 h-5 mb-2 animate-spin text-amber-500" />
                Consulting statutory databases and comparative criminal jurisprudence...
              </div>
            ) : transResult ? (
              <div className="prose prose-invert max-w-none text-xs">
                <FormattedMarkdown content={transResult.analysis} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center text-slate-500 text-xs">
                <Scale className="w-8 h-8 text-slate-700 mb-2" />
                Select a quick query chip above or type any section to view side-by-side statutory changes.
              </div>
            )}
          </ScrollArea>
        </div>
      )}

      {/* TAB 3: STATE EXAM BLUEPRINT */}
      {activeSubTab === 'planner' && (
        <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0">
          {/* Controls Form */}
          <div className="w-full md:w-80 bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3.5 shrink-0 flex flex-col justify-between">
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center">
                  <Compass className="w-4 h-4 mr-1.5 text-amber-400" />
                  Target State & Exam
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Calibrates syllabus weightage and local laws.</p>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 mb-1 block">State Judiciary</label>
                <select
                  value={planState}
                  onChange={(e) => setPlanState(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-slate-200"
                >
                  {STATE_JUDICIARY_EXAMS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 mb-1 block">Examination Stream</label>
                <select
                  value={planExam}
                  onChange={(e) => setPlanExam(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-slate-200"
                >
                  {LEGAL_EXAM_STREAMS.map((e) => (
                    <option key={e.value} value={e.value}>
                      {e.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-300 mb-1 block">Months Window</label>
                  <select
                    value={planMonths}
                    onChange={(e) => setPlanMonths(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-slate-200"
                  >
                    <option value={3}>3 Months (Rapid Sprint)</option>
                    <option value={6}>6 Months (Comprehensive)</option>
                    <option value={12}>12 Months (Foundational)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 mb-1 block">Daily Study</label>
                  <select
                    value={planHours}
                    onChange={(e) => setPlanHours(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-slate-200"
                  >
                    <option value={4}>4 Hours / Day</option>
                    <option value={6}>6 Hours / Day</option>
                    <option value={8}>8 Hours / Day</option>
                  </select>
                </div>
              </div>
            </div>

            <Button
              onClick={handleGeneratePlan}
              disabled={generatingPlan}
              className="w-full bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium"
            >
              {generatingPlan ? <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1.5" />}
              Generate Roadmap
            </Button>
          </div>

          {/* Results Area */}
          <ScrollArea className="flex-1 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            {generatingPlan ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400 text-xs">
                <Compass className="w-6 h-6 mb-2 animate-spin text-amber-500" />
                Synthesizing state exam timeline, local acts allocation, and revision schedules...
              </div>
            ) : planResult ? (
              <div className="space-y-3.5">
                {/* Clean Top Metadata Bar & Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-indigo-500/10 border border-amber-500/20">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline" className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs font-semibold">
                      🏛️ {planResult.state}
                    </Badge>
                    <Badge variant="outline" className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-xs font-medium">
                      ⚖️ {planResult.examTitle}
                    </Badge>
                    <Badge variant="outline" className="bg-slate-800 text-slate-300 border-slate-700 text-xs">
                      ⏱️ {planResult.availableMonths} Months • {planResult.dailyHours}h Daily
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        navigator.clipboard.writeText(planResult.planMarkdown);
                        toast.success('Study plan copied to clipboard!');
                      }}
                      className="h-7 px-2.5 text-[11px] text-slate-300 hover:text-white hover:bg-slate-800/60"
                    >
                      <Copy className="w-3.5 h-3.5 mr-1" /> Copy
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        window.print();
                      }}
                      className="h-7 px-2.5 text-[11px] bg-amber-600/20 border-amber-500/30 text-amber-300 hover:bg-amber-600 hover:text-white"
                    >
                      <Download className="w-3.5 h-3.5 mr-1" /> Print / Save PDF
                    </Button>
                  </div>
                </div>

                <div className="prose prose-invert max-w-none text-xs leading-relaxed">
                  <FormattedMarkdown content={planResult.planMarkdown} />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center text-slate-500 text-xs">
                <Compass className="w-8 h-8 text-slate-700 mb-2" />
                Select your target state and timeline on the left to generate a personalized examination blueprint.
              </div>
            )}
          </ScrollArea>
        </div>
      )}

      {/* TAB 4: MAINS ANSWER WRITING EVALUATOR */}
      {activeSubTab === 'mains' && (
        <div className="flex flex-col space-y-4">
          {/* Top Generator & Filter Toolbar */}
          <div className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                  <FileQuestion className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-white tracking-wide flex items-center gap-2">
                    Judicial Mains Question Generator & Past-Year Bank
                    <Badge variant="outline" className="text-[10px] bg-indigo-500/15 text-indigo-300 border-indigo-500/30 font-normal">
                      Dynamic AI Paper Setter
                    </Badge>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Generate authentic factual problem scenarios on demand, or load past-year questions across subjects.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRollRandomQuestion}
                  className="h-7 text-[11px] bg-slate-950 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
                >
                  <Dices className="w-3.5 h-3.5 mr-1 text-amber-400" /> Random PYQ
                </Button>
                <Button
                  size="sm"
                  onClick={handleGenerateQuestion}
                  disabled={generatingQuestion}
                  className="h-7 text-[11px] bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-medium shadow-xs"
                >
                  {generatingQuestion ? (
                    <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 mr-1" />
                  )}
                  {generatingQuestion ? 'Synthesizing Dispute...' : '✨ Generate New Problem Question'}
                </Button>
              </div>
            </div>

            {/* Filter / Generator Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80">
              <div>
                <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block mb-1">
                  Subject Stream
                </label>
                <select
                  value={mainsSubjectFilter}
                  onChange={(e) => setMainsSubjectFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-200"
                >
                  {LEGAL_MAINS_SUBJECTS.map((s) => (
                    <option key={s.id} value={s.id === 'ALL' ? 'ALL' : s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block mb-1">
                  Question Style
                </label>
                <select
                  value={mainsQuestionType}
                  onChange={(e) => setMainsQuestionType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-200"
                >
                  <option value="PROBLEM_BASED">Problem Scenario (Parties & Dispute Facts)</option>
                  <option value="THEORETICAL">Doctrinal & Analytical Essay</option>
                  <option value="JUDGMENT_WRITING">Judgment Writing & Charge Framing</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block mb-1">
                  Specific Topic / Section (Optional)
                </label>
                <Input
                  placeholder="e.g. Res Judicata, Bail, Zero FIR..."
                  value={mainsTopicInput}
                  onChange={(e) => setMainsTopicInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerateQuestion()}
                  className="h-7 text-xs bg-slate-950 border-slate-700"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block mb-1">
                  Or Pick Curated PYQ ({filteredQuestions.length})
                </label>
                <select
                  onChange={(e) => handleSelectSampleQuestion(e.target.value)}
                  value={SAMPLE_MAINS_QUESTIONS.some((q) => q.question === mainsQuestion) ? mainsQuestion : ''}
                  className="w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-200"
                >
                  <option value="">Select from Question Bank...</option>
                  {filteredQuestions.map((sq, i) => (
                    <option key={i} value={sq.question}>
                      [{sq.source?.split('&')[0]?.trim() || 'PYQ'}] {sq.topic}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Main Two-Column Layout */}
          <div className="flex flex-col lg:flex-row gap-4 items-start">
            {/* Question & Answer Input Column */}
            <div className="w-full lg:w-1/2 flex flex-col space-y-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-200">
                      Judicial Mains Problem Question
                    </label>
                    {activeQuestionMeta?.marks && (
                      <Badge variant="outline" className="text-[10px] bg-amber-500/15 text-amber-300 border-amber-500/30">
                        {activeQuestionMeta.marks} Marks • {activeQuestionMeta.suggestedTimeMinutes || 25} Mins
                      </Badge>
                    )}
                  </div>
                  {activeQuestionMeta?.source && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      {activeQuestionMeta.source}
                    </span>
                  )}
                </div>

                <Textarea
                  rows={4}
                  value={mainsQuestion}
                  onChange={(e) => setMainsQuestion(e.target.value)}
                  placeholder="Enter, paste, or generate a Mains problem statement or factual dispute..."
                  className="w-full text-xs bg-slate-950 border-slate-700 min-h-[90px] max-h-[160px] resize-y overflow-y-auto leading-relaxed font-sans"
                />

                {/* Key Evaluator Focus Pointers Chips */}
                {activeQuestionMeta?.statutoryPointers?.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Lightbulb className="w-3 h-3 text-amber-400" /> Focus Pointers:
                    </span>
                    {activeQuestionMeta.statutoryPointers.map((ptr, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800/80 text-amber-200/90 border border-slate-700/60"
                      >
                        {ptr}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-1 border-t border-slate-800/60">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-200">
                    Candidate's Subjective Answer
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {mainsAnswer.trim() ? mainsAnswer.trim().split(/\s+/).length : 0} words
                    </span>
                    {mainsAnswer && (
                      <button
                        onClick={() => setMainsAnswer('')}
                        className="text-[10px] text-slate-400 hover:text-rose-300 flex items-center gap-0.5"
                      >
                        <Eraser className="w-3 h-3" /> Clear
                      </button>
                    )}
                  </div>
                </div>
                <Textarea
                  rows={9}
                  value={mainsAnswer}
                  onChange={(e) => setMainsAnswer(e.target.value)}
                  placeholder="Write or paste your subjective answer here. Include statutory sections (BNS/CPC), precedents, legal issues, ratio decidendi, and concluding order..."
                  className="w-full text-xs bg-slate-950 border-slate-700 font-mono leading-relaxed min-h-[190px] max-h-[380px] resize-y overflow-y-auto"
                />
              </div>

              <Button
                onClick={handleEvaluateMains}
                disabled={evaluatingMains || !mainsQuestion.trim() || !mainsAnswer.trim()}
                className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-xs font-semibold shadow-xs shrink-0 mt-1"
              >
                {evaluatingMains ? (
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Award className="w-3.5 h-3.5 mr-1.5" />
                )}
                Evaluate Under Judicial Rubric (20 Marks)
              </Button>
            </div>

            {/* Evaluation Results Column */}
            <ScrollArea className="w-full lg:w-1/2 min-h-[520px] max-h-[700px] rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              {evaluatingMains ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400 text-xs">
                  <Award className="w-7 h-7 mb-3 animate-spin text-amber-500" />
                  <p className="font-medium text-slate-200">Benchmarking against Judicial Service Standards</p>
                  <p className="text-[11px] text-slate-400 mt-1">Analyzing issue spotting, Bare Act section accuracy, landmark precedents & ratio...</p>
                </div>
              ) : mainsEvaluation ? (
                <div className="prose prose-invert max-w-none text-xs leading-relaxed">
                  <FormattedMarkdown content={mainsEvaluation.evaluation} />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center text-slate-500 text-xs space-y-2">
                  <Award className="w-8 h-8 text-slate-700" />
                  <p className="text-slate-300 font-medium">Ready for Judicial Service Answer Evaluation</p>
                  <p className="text-[11px] text-slate-400 max-w-xs">
                    Select or generate a problem question above, draft your legal answer with sections & case laws, and evaluate it under the 20-mark official rubric.
                  </p>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      )}

      {/* TAB 5: PRELIMS BARE ACT DRILLS */}
      {activeSubTab === 'drill' && (
        <div className="flex-1 flex flex-col space-y-3 min-h-0">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={drillAct}
                onChange={(e) => setDrillAct(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1 text-xs text-slate-200"
              >
                <option value="Bharatiya Nyaya Sanhita (BNS) 2023">Bharatiya Nyaya Sanhita (BNS) 2023</option>
                <option value="Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023">Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023</option>
                <option value="Bharatiya Sakshya Adhiniyam (BSA) 2023">Bharatiya Sakshya Adhiniyam (BSA) 2023</option>
                <option value="Code of Civil Procedure, 1908">Code of Civil Procedure (CPC) 1908</option>
                <option value="Constitution of India">Constitution of India</option>
              </select>

              <Input
                placeholder="Topic or Chapter (e.g. Bail, Murder, Injunctions)..."
                value={drillTopic}
                onChange={(e) => setDrillTopic(e.target.value)}
                className="text-xs bg-slate-950 border-slate-700 h-8 w-48"
              />
            </div>

            <Button
              size="sm"
              onClick={handleGenerateDrill}
              disabled={loadingDrill}
              className="bg-amber-600 hover:bg-amber-500 text-white text-xs"
            >
              {loadingDrill ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" /> : <Sparkles className="w-3.5 h-3.5 mr-1" />}
              Generate 5-Question Drill
            </Button>
          </div>

          {/* Questions Stream */}
          <ScrollArea className="flex-1 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            {loadingDrill ? (
              <div className="flex items-center justify-center h-48 text-slate-400 text-xs">
                <RefreshCw className="w-4 h-4 mr-2 animate-spin text-amber-500" />
                Crafting state-level Prelims MCQs from the Bare Act...
              </div>
            ) : drillQuestions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center text-slate-500 text-xs">
                <CheckCircle2 className="w-8 h-8 text-slate-700 mb-2" />
                Select an Act above and click "Generate 5-Question Drill" to practice high-yield Bare Act sections.
              </div>
            ) : (
              <div className="space-y-4 max-w-3xl mx-auto pb-4">
                {drillQuestions.map((q, qIdx) => (
                  <Card key={qIdx} className="p-4 bg-slate-900/60 border-slate-800 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-semibold text-slate-100">
                        Q{qIdx + 1}. {q.question}
                      </h4>
                      {q.sectionCitation && (
                        <Badge variant="outline" className="text-[10px] bg-slate-800 text-amber-400 border-amber-500/30 shrink-0">
                          {q.sectionCitation}
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      {q.options?.map((opt, optIdx) => {
                        const isSelected = userAnswers[qIdx] === optIdx;
                        const isCorrect = q.correctIndex === optIdx;
                        let optStyle = 'border-slate-800 hover:bg-slate-800/60 text-slate-300';

                        if (submittedDrill) {
                          if (isCorrect) {
                            optStyle = 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300 font-medium';
                          } else if (isSelected && !isCorrect) {
                            optStyle = 'border-rose-500/50 bg-rose-500/10 text-rose-300';
                          }
                        } else if (isSelected) {
                          optStyle = 'border-amber-500/50 bg-amber-500/10 text-amber-300 font-medium';
                        }

                        return (
                          <div
                            key={optIdx}
                            onClick={() => !submittedDrill && setUserAnswers({ ...userAnswers, [qIdx]: optIdx })}
                            className={`p-2 rounded-lg border text-xs cursor-pointer transition-all flex items-center space-x-2.5 ${optStyle}`}
                          >
                            <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] flex items-center justify-center font-bold">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span>{opt}</span>
                          </div>
                        );
                      })}
                    </div>

                    {submittedDrill && (
                      <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                        <span className="font-semibold text-amber-400">Explanation: </span>
                        {q.explanation}
                      </div>
                    )}
                  </Card>
                ))}

                {/* Score & Submit Button */}
                <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-xl">
                  <div>
                    {submittedDrill ? (
                      <span className="text-sm font-semibold text-emerald-400">
                        Score: {getScore()} / {drillQuestions.length} Correct
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">
                        Answer all questions and submit for instant section feedback.
                      </span>
                    )}
                  </div>

                  {!submittedDrill ? (
                    <Button
                      size="sm"
                      onClick={() => setSubmittedDrill(true)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium"
                    >
                      Submit Answers
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={handleGenerateDrill}
                      className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium"
                    >
                      Practice Next Drill
                    </Button>
                  )}
                </div>
              </div>
            )}
          </ScrollArea>
        </div>
      )}

      {/* TAB 6: PREVIOUS YEAR PAPERS (PYQs) & AI SOLVER */}
      {activeSubTab === 'pyq' && (
        <div className="flex flex-col space-y-4">
          {/* Header Description & Search/Filter Controls */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-400" />
                  Previous Year Papers (PYQ) Bank & AI Legal Solver
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Search authentic State Judicial Service & Prosecution exam question papers. Ask AI for verified Prelims answer keys with statutory citations or top-ranker Mains model answers.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-amber-500/10 text-amber-300 border-amber-500/30 text-xs">
                  {filteredPyqs.length} Papers Available
                </Badge>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 pt-1">
              <div className="relative md:col-span-2">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <Input
                  placeholder="Search papers by state, subject, question keywords..."
                  value={pyqSearch}
                  onChange={(e) => setPyqSearch(e.target.value)}
                  className="pl-8 text-xs bg-slate-950/80 border-slate-700 h-8"
                />
              </div>

              <div>
                <select
                  value={pyqStateFilter}
                  onChange={(e) => setPyqStateFilter(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200 h-8 focus:outline-none focus:border-amber-500"
                >
                  <option value="ALL">All States & UTs</option>
                  {STATE_JUDICIARY_EXAMS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.stateName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={pyqExamFilter}
                  onChange={(e) => setPyqExamFilter(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200 h-8 focus:outline-none focus:border-amber-500"
                >
                  <option value="ALL">All Streams</option>
                  {LEGAL_EXAM_STREAMS.map((e) => (
                    <option key={e.value} value={e.value}>
                      {e.shortName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-1.5">
                <select
                  value={pyqStageFilter}
                  onChange={(e) => setPyqStageFilter(e.target.value)}
                  className="w-1/2 bg-slate-950/80 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 h-8 focus:outline-none focus:border-amber-500"
                >
                  <option value="ALL">All Stages</option>
                  <option value="PRELIMS">Prelims</option>
                  <option value="MAINS">Mains</option>
                </select>

                <select
                  value={pyqYearFilter}
                  onChange={(e) => setPyqYearFilter(e.target.value)}
                  className="w-1/2 bg-slate-950/80 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 h-8 focus:outline-none focus:border-amber-500"
                >
                  <option value="ALL">All Years</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                  <option value="2022">2022</option>
                  <option value="2021">2021</option>
                  <option value="2020">2020</option>
                </select>
              </div>
            </div>
          </div>

          {/* Paper Cards Grid */}
          {loadingPyqs ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <RefreshCw className="w-5 h-5 animate-spin mr-2 text-amber-400" />
              <span className="text-xs">Loading Question Papers...</span>
            </div>
          ) : filteredPyqs.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-slate-800 rounded-xl bg-slate-900/30">
              <FileQuestion className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400 font-medium">No past question papers match your filters</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Try broadening your search or use the Autonomous Scraper to pull more past papers into your legal vault.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPyqSearch('');
                  setPyqStateFilter('ALL');
                  setPyqExamFilter('ALL');
                  setPyqStageFilter('ALL');
                  setPyqYearFilter('ALL');
                }}
                className="mt-3 text-xs border-slate-700 text-slate-300"
              >
                Reset Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredPyqs.map((paper) => {
                const stage = paper.metadata?.stage || (paper.title.toLowerCase().includes('prelim') ? 'PRELIMS' : 'MAINS');
                const isPrelims = stage === 'PRELIMS';
                const year = paper.metadata?.year || (paper.title.match(/20\d\d/) ? paper.title.match(/20\d\d/)[0] : '2023');
                const stateObj = STATE_JUDICIARY_EXAMS.find((s) => s.value === paper.state);
                const stateLabel = stateObj ? stateObj.stateName : paper.state || 'National';
                const questionCount = paper.metadata?.questionCount || (isPrelims ? '125 MCQs' : '5 Questions');
                const marks = paper.metadata?.totalMarks || 100;

                return (
                  <Card
                    key={paper.id}
                    className="p-3.5 bg-slate-900/80 border-slate-800 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge
                            variant="outline"
                            className="bg-amber-500/10 text-amber-300 border-amber-500/30 text-[10px] font-semibold uppercase tracking-wider"
                          >
                            {stateLabel}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={
                              isPrelims
                                ? 'bg-purple-500/10 text-purple-300 border-purple-500/30 text-[10px]'
                                : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 text-[10px]'
                            }
                          >
                            {isPrelims ? 'Prelims (MCQs)' : 'Mains (Subjective)'}
                          </Badge>
                          <Badge variant="outline" className="bg-slate-800 text-slate-300 border-slate-700 text-[10px]">
                            {year}
                          </Badge>
                        </div>
                      </div>

                      <h4 className="text-xs font-semibold text-slate-100 leading-snug line-clamp-2">
                        {paper.title}
                      </h4>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {year}
                        </span>
                        <span className="flex items-center gap-1">
                          <ListOrdered className="w-3 h-3 text-slate-500" />
                          {questionCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Award className="w-3 h-3 text-slate-500" />
                          {marks} Marks
                        </span>
                      </div>

                      {(paper.summary || paper.textContent) && (
                        <p className="text-[11px] text-slate-400 line-clamp-3 bg-slate-950/60 p-2 rounded border border-slate-800/80 font-mono leading-relaxed">
                          {(paper.summary || paper.textContent).slice(0, 180)}...
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedPyqPaper(paper);
                          setPyqModalOpen(true);
                        }}
                        className="flex-1 text-xs border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white h-7"
                      >
                        <Eye className="w-3 h-3 mr-1.5" />
                        View Paper
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          handleSolvePYQ(paper);
                        }}
                        className="flex-1 text-xs bg-amber-600 hover:bg-amber-500 text-white font-medium h-7"
                      >
                        <Sparkles className="w-3 h-3 mr-1.5" />
                        AI Solve
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: AUTONOMOUS SCRAPER AGENT */}
      <Dialog open={scraperModalOpen} onOpenChange={setScraperModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-sm font-semibold text-white">
              <Bot className="w-4 h-4 mr-2 text-amber-400" />
              Autonomous Legal Scraper Agent
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Discovers official Bare Acts, amendments, and past papers from open government repositories and streams them directly into your secure cloud bucket.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRunScraper} className="space-y-3.5 py-2">
            <div>
              <label className="text-xs font-medium text-slate-300 mb-1 block">Target Legal Source</label>
              <select
                value={scraperSource}
                onChange={(e) => setScraperSource(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
              >
                <option value="INDIA_CODE">India Code (Official Central & State Bare Acts)</option>
                <option value="ESCR_SUPREME_COURT">e-SCR (Supreme Court Landmark Judgments)</option>
                <option value="STATE_PSC_PYQ">State Public Service Commission Archives (PYQs)</option>
                <option value="CUSTOM_SEARCH">All Open Legal Repositories</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 mb-1 block">Statute Name / Topic / Search Query</label>
              <Input
                placeholder="e.g. Specific Relief Act 1963, POCSO Act, or DJS 2023 Mains..."
                value={scraperQuery}
                onChange={(e) => setScraperQuery(e.target.value)}
                className="text-xs bg-slate-950 border-slate-700"
                required
              />
            </div>

            <div className="p-2.5 rounded bg-amber-950/20 border border-amber-500/20 text-[11px] text-amber-300/90 leading-relaxed">
              <strong>Enterprise Safe Scraper:</strong> Discovers authoritative open-source texts without copyright violations. Files are stored under your organization's private bucket prefix.
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setScraperModalOpen(false)}
                className="text-slate-400 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={scraperRunning}
                className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium"
              >
                {scraperRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Bot className="w-3.5 h-3.5 mr-1.5" />}
                Dispatch Agent
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: UPLOAD BOOK / NOTES (BYOD) */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-sm font-semibold text-white">
              <Upload className="w-4 h-4 mr-2 text-amber-400" />
              Upload Legal Study Book / Notes (BYOD)
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Upload institutional textbooks, coaching notes, or case digests to your private Google Cloud Storage bucket.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUploadBook} className="space-y-3 py-2">
            <div>
              <label className="text-xs font-medium text-slate-300 mb-1 block">Title / Subject</label>
              <Input
                placeholder="e.g. Criminal Procedure Notes or Constitutional Law Compendium..."
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                className="text-xs bg-slate-950 border-slate-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-slate-300 mb-1 block">Category</label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
                >
                  <option value="BOOK_COMMENTARY">Book Commentary / Notes</option>
                  <option value="SYLLABUS">Syllabus & Blueprints</option>
                  <option value="PYQ">Past Year Paper</option>
                  <option value="CASE_LAW">Judgments Digest</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 mb-1 block">Target Exam</label>
                <select
                  value={uploadExam}
                  onChange={(e) => setUploadExam(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
                >
                  {LEGAL_EXAM_STREAMS.map((e) => (
                    <option key={e.value} value={e.value}>
                      {e.shortName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 mb-1 block">PDF / Text File</label>
              <input
                type="file"
                accept=".pdf,.txt,.md"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setUploadModalOpen(false)}
                className="text-slate-400 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={uploading}
                className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium"
              >
                {uploading ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Upload className="w-3.5 h-3.5 mr-1.5" />}
                Upload to Vault
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: VIEW PAST QUESTION PAPER */}
      <Dialog open={pyqModalOpen} onOpenChange={setPyqModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 sm:max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="bg-amber-500/10 text-amber-300 border-amber-500/30 text-xs">
                {selectedPyqPaper?.state || 'ALL-INDIA'}
              </Badge>
              <Badge variant="outline" className="bg-slate-800 text-slate-300 border-slate-700 text-xs">
                {selectedPyqPaper?.metadata?.stage || 'PAST PAPER'}
              </Badge>
              <Badge variant="outline" className="bg-slate-800 text-slate-300 border-slate-700 text-xs">
                {selectedPyqPaper?.metadata?.year || '2023'}
              </Badge>
            </div>
            <DialogTitle className="text-base font-semibold text-white leading-tight">
              {selectedPyqPaper?.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Exam: {selectedPyqPaper?.targetExams || 'JUDICIARY'} • Total Marks: {selectedPyqPaper?.metadata?.totalMarks || 100} • Questions: {selectedPyqPaper?.metadata?.questionCount || 'Full Set'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden my-2">
            <ScrollArea className="h-[50vh] pr-3 rounded-lg bg-slate-950/80 border border-slate-800 p-4">
              <pre className="text-xs text-slate-200 font-mono whitespace-pre-wrap leading-relaxed select-text">
                {selectedPyqPaper?.metadata?.paperContent || selectedPyqPaper?.metadata?.fullText || selectedPyqPaper?.metadata?.snippet || selectedPyqPaper?.textContent || selectedPyqPaper?.summary || 'No text content available for this paper.'}
              </pre>
            </ScrollArea>
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between pt-2 border-t border-slate-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setPyqModalOpen(false)}
              className="text-slate-400 text-xs"
            >
              Close
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setPyqModalOpen(false);
                handleSolvePYQ(selectedPyqPaper);
              }}
              className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Ask AI to Solve this Paper
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: AI EXAM SOLVER / MODEL ANSWERS */}
      <Dialog open={pyqSolverOpen} onOpenChange={setPyqSolverOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 sm:max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <DialogTitle className="text-base font-semibold text-white">
                  AI Legal Exam Solver
                </DialogTitle>
                <Badge variant="outline" className="bg-amber-500/10 text-amber-300 border-amber-500/30 text-xs">
                  {selectedPyqPaper?.metadata?.stage || 'EXAM SOLVER'}
                </Badge>
              </div>
            </div>
            <DialogDescription className="text-xs text-slate-400 leading-snug">
              {selectedPyqPaper?.title}
            </DialogDescription>
          </DialogHeader>

          {/* Specific Question Query Input */}
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg space-y-2">
            <label className="text-[11px] font-medium text-slate-300 block">
              Solve Entire Paper or Focus on Specific Question:
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. 'Solve Question 2 on constructive res judicata' or leave blank to solve full paper..."
                value={pyqSpecificQuestion}
                onChange={(e) => setPyqSpecificQuestion(e.target.value)}
                className="text-xs bg-slate-900 border-slate-700 h-8 flex-1"
                disabled={solvingPyq}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSolvePYQ(selectedPyqPaper, pyqSpecificQuestion);
                  }
                }}
              />
              <Button
                size="sm"
                onClick={() => handleSolvePYQ(selectedPyqPaper, pyqSpecificQuestion)}
                disabled={solvingPyq}
                className="bg-amber-600 hover:bg-amber-500 text-white text-xs h-8 px-3"
              >
                {solvingPyq ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" /> : <Send className="w-3.5 h-3.5 mr-1" />}
                Solve
              </Button>
            </div>
          </div>

          {/* Solution Body */}
          <div className="flex-1 overflow-hidden my-2">
            {solvingPyq ? (
              <div className="h-[45vh] flex flex-col items-center justify-center space-y-3 bg-slate-950/60 rounded-lg border border-slate-800 p-6 text-center">
                <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-white">
                    Synthesizing Judicial Solutions & Model Answers...
                  </p>
                  <p className="text-xs text-slate-400 max-w-md">
                    Cross-referencing statutory bare acts (IPC/CrPC & BNS/BNSS/BSA), invoking landmark Supreme Court rulings, and structuring rank-1 legal reasoning.
                  </p>
                </div>
              </div>
            ) : pyqSolutionResult ? (
              <ScrollArea className="h-[48vh] pr-3 rounded-lg bg-slate-950/80 border border-slate-800 p-4">
                <div className="space-y-3">
                  {/* Telemetry info header */}
                  <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-2">
                    <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Verified AI Legal Engine ({pyqSolutionResult.model || 'Gemini 2.5 Pro'})
                    </span>
                    <div className="flex items-center gap-3 text-slate-400">
                      {pyqSolutionResult.latencyMs && (
                        <span>Latency: {(pyqSolutionResult.latencyMs / 1000).toFixed(1)}s</span>
                      )}
                      {pyqSolutionResult.tokens?.totalTokens && (
                        <span>Tokens: {pyqSolutionResult.tokens.totalTokens}</span>
                      )}
                    </div>
                  </div>

                  <div className="text-xs leading-relaxed text-slate-200">
                    <FormattedMarkdown content={pyqSolutionResult.solution} />
                  </div>
                </div>
              </ScrollArea>
            ) : (
              <div className="h-[40vh] flex flex-col items-center justify-center text-slate-400 space-y-2 border border-dashed border-slate-800 rounded-lg">
                <Bot className="w-8 h-8 text-slate-600" />
                <p className="text-xs">Click Solve above to synthesize model answers for this past paper.</p>
              </div>
            )}
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between pt-2 border-t border-slate-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setPyqSolverOpen(false)}
              className="text-slate-400 text-xs"
            >
              Close
            </Button>
            {pyqSolutionResult && (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(pyqSolutionResult.solution || '');
                    toast.success('Model Answer copied to clipboard!');
                  }}
                  className="text-xs border-slate-700 text-slate-200 hover:bg-slate-800"
                >
                  <Copy className="w-3.5 h-3.5 mr-1.5" />
                  Copy Solution
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
