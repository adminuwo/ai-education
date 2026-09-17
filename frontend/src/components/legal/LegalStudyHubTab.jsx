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
  Plus
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

const SAMPLE_MAINS_QUESTIONS = [
  {
    subject: 'Criminal Law (BNS & BNSS)',
    question: 'Discuss the statutory changes introduced in the Bharatiya Nyaya Sanhita, 2023 regarding the offence of murder by five or more persons acting in concert on grounds of caste, community, or religion. How does it alter the burden of proof and sentencing?',
  },
  {
    subject: 'Civil Procedure (CPC 1908)',
    question: 'Explain the doctrine of Res Judicata under Section 11 of the Code of Civil Procedure, 1908. Distinguish between actual Res Judicata and Constructive Res Judicata with leading case illustrations.',
  },
  {
    subject: 'Constitutional Law',
    question: 'Critically analyze the scope of Judicial Review of administrative actions under Articles 32 and 226 of the Constitution of India. What are the grounds on which a writ of Certiorari may be issued against a quasi-judicial body?',
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
    fetchScraperJobs();
  }, [fetchLibrary, fetchScraperJobs]);

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
      setTimeout(fetchLibrary, 2500);
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

  return (
    <div className="flex flex-col h-full space-y-4">
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
              <div className="prose prose-invert max-w-none text-xs">
                <FormattedMarkdown content={planResult.planMarkdown} />
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
        <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0">
          {/* Question & Answer Input */}
          <div className="w-full md:w-1/2 flex flex-col space-y-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-200">Judicial Mains Problem Question</label>
                <select
                  onChange={(e) => {
                    const found = SAMPLE_MAINS_QUESTIONS.find((q) => q.question === e.target.value);
                    if (found) {
                      setMainsQuestion(found.question);
                      setMainsSubject(found.subject);
                    }
                  }}
                  className="bg-slate-950 border border-slate-700 rounded text-[11px] px-2 py-0.5 text-slate-300"
                >
                  <option value="">Load Sample Question...</option>
                  {SAMPLE_MAINS_QUESTIONS.map((sq, i) => (
                    <option key={i} value={sq.question}>{sq.subject}</option>
                  ))}
                </select>
              </div>
              <Textarea
                rows={3}
                value={mainsQuestion}
                onChange={(e) => setMainsQuestion(e.target.value)}
                placeholder="Enter or paste the Mains problem statement or question..."
                className="text-xs bg-slate-950 border-slate-700 resize-none"
              />
            </div>

            <div className="flex-1 flex flex-col min-h-0">
              <label className="text-xs font-semibold text-slate-200 mb-1.5">Candidate's Subjective Answer</label>
              <Textarea
                rows={10}
                value={mainsAnswer}
                onChange={(e) => setMainsAnswer(e.target.value)}
                placeholder="Write or paste your subjective answer here. Include statutory sections (BNS/CPC), precedents, and legal reasoning..."
                className="flex-1 text-xs bg-slate-950 border-slate-700 font-mono leading-relaxed"
              />
            </div>

            <Button
              onClick={handleEvaluateMains}
              disabled={evaluatingMains}
              className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium"
            >
              {evaluatingMains ? <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Award className="w-3.5 h-3.5 mr-1.5" />}
              Evaluate Under Judicial Rubric (20 Marks)
            </Button>
          </div>

          {/* Evaluation Results */}
          <ScrollArea className="w-full md:w-1/2 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            {evaluatingMains ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400 text-xs">
                <Award className="w-6 h-6 mb-2 animate-spin text-amber-500" />
                Benchmarking against Judicial Service Mains standards (Issues, Sections, Rulings, Ratio)...
              </div>
            ) : mainsEvaluation ? (
              <div className="prose prose-invert max-w-none text-xs">
                <FormattedMarkdown content={mainsEvaluation.evaluation} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center text-slate-500 text-xs">
                <Award className="w-8 h-8 text-slate-700 mb-2" />
                Submit your subjective legal answer to receive detailed score breakdown and a ranker model answer.
              </div>
            )}
          </ScrollArea>
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
    </div>
  );
}
