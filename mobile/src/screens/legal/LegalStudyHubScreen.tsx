import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Alert,
  Platform,
  Share,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { legalApi } from '../../lib/api';
import {
  Scale,
  BookOpen,
  Sparkles,
  Search,
  FileText,
  RefreshCw,
  CheckCircle2,
  ChevronRight,
  Download,
  Bot,
  ArrowLeft,
  Filter,
  Award,
  Send,
  Copy,
  Plus,
  Zap,
} from 'lucide-react-native';

const PRESET_HOTSPOTS: Record<string, Array<{ label: string; q: string }>> = {
  BSA: [
    { label: '§63 Electronic Evidence', q: 'Section 63 admissibility of electronic records and certificate format under BSA 2023 vs 65B IEA' },
    { label: '§23 Discovery Confession', q: 'Section 23 confession to police officer leading to discovery of fact under BSA 2023 vs Sec 27 IEA' },
    { label: '§26 Dying Declaration', q: 'Section 26 dying declaration rules and evidentiary value under BSA 2023 vs Sec 32 IEA' },
    { label: '§118 Dowry Death', q: 'Section 118 presumption as to dowry death under BSA 2023' },
  ],
  BNS: [
    { label: '§103 Mob Lynching', q: 'Section 103 punishment for murder and mob lynching under BNS 2023' },
    { label: '§111 Organised Crime', q: 'Section 111 organized crime ingredients and penalties under BNS 2023' },
    { label: '§152 Sovereignty of India', q: 'Section 152 acts endangering sovereignty of India under BNS 2023' },
    { label: '§69 Deceitful Intercourse', q: 'Section 69 sexual intercourse by deceitful means or promise of marriage' },
  ],
  BNSS: [
    { label: '§35 Arrest Guidelines', q: 'Section 35 when police may arrest without warrant and prior DSP permission' },
    { label: '§105 Video Recording', q: 'Section 105 mandatory electronic videography of search and seizure' },
    { label: '§173 Zero FIR', q: 'Section 173 Zero FIR and electronic FIR reporting timeline under BNSS 2023' },
    { label: '§482 Anticipatory Bail', q: 'Section 482 direction for grant of anticipatory bail under BNSS 2023' },
  ],
  CPC: [
    { label: '§9 Civil Jurisdiction', q: 'Section 9 courts to try all civil suits unless expressly barred' },
    { label: '§11 Res Judicata', q: 'Section 11 res judicata and constructive res judicata under CPC' },
    { label: 'Order 39 Injunctions', q: 'Order 39 Rules 1 and 2 temporary injunctions under CPC' },
  ],
  CONSTI: [
    { label: 'Art 14 Equality', q: 'Article 14 equality before law and non-arbitrariness doctrine' },
    { label: 'Art 21 Life & Liberty', q: 'Article 21 protection of life and personal liberty' },
    { label: 'Art 32 & 226 Writs', q: 'Articles 32 and 226 constitutional writ jurisdiction' },
  ],
};

const STATE_OPTIONS = [
  'ALL', 'DELHI', 'BIHAR', 'UP', 'RAJASTHAN', 'MP', 'HARYANA', 'PUNJAB',
  'MAHARASHTRA', 'GUJARAT', 'KARNATAKA', 'HIMACHAL', 'UTTARAKHAND', 'WEST_BENGAL', 'JHARKHAND'
];

export default function LegalStudyHubScreen({ navigation }: any) {
  const { currentOrg, user } = useAuth();
  const { colors, isDark } = useTheme();

  // Sub-tabs: 'vault' | 'pyq' | 'transition' | 'drills'
  const [activeTab, setActiveTab] = useState<'vault' | 'pyq' | 'transition' | 'drills'>('vault');

  // Vault & Documents state
  const [documents, setDocuments] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedState, setSelectedState] = useState('ALL');

  // Reader Modal state
  const [readerModalOpen, setReaderModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [exploringDoc, setExploringDoc] = useState(false);
  const [explorationResult, setExplorationResult] = useState<any>(null);

  // PYQ Solver state
  const [pyqModalOpen, setPyqModalOpen] = useState(false);
  const [selectedPyq, setSelectedPyq] = useState<any>(null);
  const [solvingPyq, setSolvingPyq] = useState(false);
  const [pyqSolution, setPyqSolution] = useState<any>(null);

  // Discovery Agent Modal
  const [discoverModalOpen, setDiscoverModalOpen] = useState(false);
  const [discoverState, setDiscoverState] = useState('JHARKHAND');
  const [discoverYear, setDiscoverYear] = useState('2023');
  const [discoverStage, setDiscoverStage] = useState('MAINS');
  const [discoverSubject, setDiscoverSubject] = useState('Commercial Courts & Local Acts');
  const [discovering, setDiscovering] = useState(false);

  // Transition engine state
  const [transQuery, setTransQuery] = useState('IPC Section 300/302 vs BNS Section 100/101/103');
  const [transLoading, setTransLoading] = useState(false);
  const [transResult, setTransResult] = useState<string | null>(null);

  // Drills state
  const [drillSubject, setDrillSubject] = useState('Bharatiya Nyaya Sanhita, 2023');
  const [drillsLoading, setDrillsLoading] = useState(false);
  const [drillQuestions, setDrillQuestions] = useState<any[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showDrillResults, setShowDrillResults] = useState(false);

  // Fetch documents from backend
  const fetchLibrary = useCallback(async () => {
    setLoadingDocs(true);
    try {
      const res = await legalApi.getLibrary({
        category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
        state: selectedState !== 'ALL' ? selectedState : undefined,
        search: searchQuery.trim() || undefined,
      });
      setDocuments(res.assets || []);
    } catch (e: any) {
      console.warn('Error fetching legal library:', e?.message);
    } finally {
      setLoadingDocs(false);
    }
  }, [selectedCategory, selectedState, searchQuery]);

  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  // Handle AI Section Explorer inside document reader
  const handleExploreSection = async (customQuery?: string) => {
    const q = customQuery || docSearchQuery.trim();
    if (!q || !selectedDoc) return;
    setExploringDoc(true);
    try {
      const res = await legalApi.exploreStatute({
        actName: selectedDoc.actName || selectedDoc.title,
        query: q,
      });
      setExplorationResult(res);
    } catch (e: any) {
      Alert.alert('AI Exploration Error', e?.response?.data?.error || 'Could not explore section.');
    } finally {
      setExploringDoc(false);
    }
  };

  // Handle AI Solver on PYQ
  const handleSolvePaper = async () => {
    if (!selectedPyq) return;
    setSolvingPyq(true);
    try {
      const res = await legalApi.solvePYQPaper({
        paperId: selectedPyq.id,
      });
      setPyqSolution(res);
    } catch (e: any) {
      Alert.alert('AI Solver Error', e?.response?.data?.error || 'Could not solve question paper.');
    } finally {
      setSolvingPyq(false);
    }
  };

  // Handle Autonomous Paper Discovery
  const handleDiscoverPaper = async () => {
    setDiscovering(true);
    try {
      const res = await legalApi.discoverPYQPaper({
        state: discoverState,
        examType: 'JUDICIARY',
        stage: discoverStage,
        year: parseInt(discoverYear, 10) || 2023,
        subject: discoverSubject,
      });
      Alert.alert('Success', res.message || 'Paper discovered and added to library!');
      setDiscoverModalOpen(false);
      await fetchLibrary();
      if (res.asset) {
        setSelectedPyq(res.asset);
        setPyqSolution(null);
        setPyqModalOpen(true);
      }
    } catch (e: any) {
      Alert.alert('Discovery Note', e?.response?.data?.error || 'Autonomous agent could not discover paper.');
    } finally {
      setDiscovering(false);
    }
  };

  // Handle Criminal Law Transition
  const handleRunTransition = async (queryText?: string) => {
    const q = queryText || transQuery;
    setTransLoading(true);
    try {
      const res = await legalApi.compareCriminalLaws({ query: q });
      setTransResult(res.analysis || res.content || 'Comparative analysis complete.');
    } catch (e: any) {
      Alert.alert('Analysis Note', e?.response?.data?.error || 'Comparative engine temporarily unavailable.');
    } finally {
      setTransLoading(false);
    }
  };

  // Generate Prelims MCQs
  const handleGenerateDrills = async () => {
    setDrillsLoading(true);
    setDrillQuestions([]);
    setSelectedAnswers({});
    setShowDrillResults(false);
    try {
      const res = await legalApi.generateSectionDrill({
        subject: drillSubject,
        count: 5,
      });
      setDrillQuestions(res.questions || []);
    } catch (e: any) {
      Alert.alert('Drill Error', e?.response?.data?.error || 'Could not generate MCQs.');
    } finally {
      setDrillsLoading(false);
    }
  };

  // Helper to determine hotspot key for an act
  const getActHotspotKey = (doc: any) => {
    const title = (doc?.title || '').toUpperCase();
    const act = (doc?.actName || '').toUpperCase();
    if (title.includes('SAKSHYA') || act.includes('SAKSHYA')) return 'BSA';
    if (title.includes('NYAYA') || act.includes('NYAYA')) return 'BNS';
    if (title.includes('NAGARIK') || act.includes('NAGARIK')) return 'BNSS';
    if (title.includes('CIVIL PROCEDURE') || title.includes('CPC')) return 'CPC';
    if (title.includes('CONSTITUTION')) return 'CONSTI';
    return null;
  };

  const pyqPapers = documents.filter((d) => d.category === 'PYQ');
  const bareActsAndDocs = documents.filter((d) => d.category !== 'PYQ');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Bar */}
      <View style={[styles.headerBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation?.goBack ? navigation.goBack() : null}
          style={styles.backBtn}
        >
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <View style={styles.headerBadgeRow}>
            <Scale size={18} color="#f59e0b" />
            <Text style={[styles.headerTitle, { color: colors.text }]}>Judicial & ADP Hub</Text>
          </View>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {currentOrg?.name || 'Legal Academy'} • AI-Legal Enterprise
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => fetchLibrary()}
          style={[styles.refreshBtn, { borderColor: colors.border }]}
        >
          <RefreshCw size={16} color={loadingDocs ? '#f59e0b' : colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Top Segmented Tabs */}
      <View style={[styles.tabBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => setActiveTab('vault')}
          style={[styles.tabBtn, activeTab === 'vault' && styles.activeTabBtn]}
        >
          <BookOpen size={15} color={activeTab === 'vault' ? '#f59e0b' : colors.textSecondary} />
          <Text style={[styles.tabLabel, { color: activeTab === 'vault' ? '#f59e0b' : colors.textSecondary }]}>
            Bare Acts ({bareActsAndDocs.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('pyq')}
          style={[styles.tabBtn, activeTab === 'pyq' && styles.activeTabBtn]}
        >
          <FileText size={15} color={activeTab === 'pyq' ? '#f59e0b' : colors.textSecondary} />
          <Text style={[styles.tabLabel, { color: activeTab === 'pyq' ? '#f59e0b' : colors.textSecondary }]}>
            Past Papers ({pyqPapers.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('transition')}
          style={[styles.tabBtn, activeTab === 'transition' && styles.activeTabBtn]}
        >
          <Scale size={15} color={activeTab === 'transition' ? '#f59e0b' : colors.textSecondary} />
          <Text style={[styles.tabLabel, { color: activeTab === 'transition' ? '#f59e0b' : colors.textSecondary }]}>
            BNS Transition
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('drills')}
          style={[styles.tabBtn, activeTab === 'drills' && styles.activeTabBtn]}
        >
          <Sparkles size={15} color={activeTab === 'drills' ? '#f59e0b' : colors.textSecondary} />
          <Text style={[styles.tabLabel, { color: activeTab === 'drills' ? '#f59e0b' : colors.textSecondary }]}>
            MCQ Drills
          </Text>
        </TouchableOpacity>
      </View>

      {/* TAB 1: BARE ACTS & VAULT */}
      {activeTab === 'vault' && (
        <ScrollView contentContainerStyle={styles.contentPad}>
          {/* Search bar */}
          <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Search size={16} color={colors.textSecondary} />
            <TextInput
              placeholder="Search Bare Acts, sections, doctrines..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={[styles.searchInput, { color: colors.text }]}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Statutes List */}
          {loadingDocs ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#f59e0b" />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading statutory vault...</Text>
            </View>
          ) : (
            bareActsAndDocs.map((doc) => {
              const hotspotKey = getActHotspotKey(doc);
              return (
                <TouchableOpacity
                  key={doc.id}
                  onPress={() => {
                    setSelectedDoc(doc);
                    setDocSearchQuery('');
                    setExplorationResult(null);
                    setReaderModalOpen(true);
                  }}
                  style={[styles.statuteCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.badgePill}>
                      <Text style={styles.badgePillText}>{doc.category || 'BARE ACT'}</Text>
                    </View>
                    {doc.metadata?.sectionCount && (
                      <Text style={styles.sectionCountText}>• {doc.metadata.sectionCount} Sections</Text>
                    )}
                  </View>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{doc.title}</Text>
                  <Text style={[styles.cardSummary, { color: colors.textSecondary }]} numberOfLines={2}>
                    {doc.summary || 'Statutory provisions and examination curriculum.'}
                  </Text>

                  {hotspotKey && PRESET_HOTSPOTS[hotspotKey] && (
                    <View style={styles.hotspotRow}>
                      <Zap size={11} color="#f59e0b" />
                      <Text style={styles.hotspotLabel}>Hotspots:</Text>
                      {PRESET_HOTSPOTS[hotspotKey].slice(0, 2).map((h, i) => (
                        <View key={i} style={[styles.miniChip, { borderColor: colors.border }]}>
                          <Text style={styles.miniChipText}>{h.label}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <View style={styles.cardFooter}>
                    <Text style={styles.viewDocLink}>Read Act & Explore Sections →</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}

      {/* TAB 2: PAST PAPERS & PYQ BANK */}
      {activeTab === 'pyq' && (
        <ScrollView contentContainerStyle={styles.contentPad}>
          {/* Autonomous Discovery Agent Banner */}
          <TouchableOpacity
            onPress={() => setDiscoverModalOpen(true)}
            style={styles.discoverBanner}
          >
            <View style={styles.discoverBannerLeft}>
              <Sparkles size={18} color="#f59e0b" />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.discoverBannerTitle}>Autonomous Past Paper Crawler</Text>
                <Text style={styles.discoverBannerSub}>
                  Find & ingest PYQs for any State, Exam Stream & Year
                </Text>
              </View>
            </View>
            <View style={styles.discoverBtnPill}>
              <Text style={styles.discoverBtnText}>+ Discover</Text>
            </View>
          </TouchableOpacity>

          {/* PYQ List */}
          {loadingDocs ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#f59e0b" />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading PYQ archive...</Text>
            </View>
          ) : (
            pyqPapers.map((paper) => (
              <View
                key={paper.id}
                style={[styles.statuteCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.badgePill, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
                    <Text style={[styles.badgePillText, { color: '#c084fc' }]}>{paper.state || 'PYQ'}</Text>
                  </View>
                  <Text style={styles.sectionCountText}>
                    {paper.metadata?.year || '2023'} • {paper.metadata?.stage || 'MAINS'}
                  </Text>
                </View>

                <Text style={[styles.cardTitle, { color: colors.text }]}>{paper.title}</Text>
                <Text style={[styles.cardSummary, { color: colors.textSecondary }]} numberOfLines={2}>
                  {paper.summary}
                </Text>

                <View style={styles.pyqActionRow}>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedPyq(paper);
                      setPyqSolution(null);
                      setPyqModalOpen(true);
                    }}
                    style={[styles.pyqSecondaryBtn, { borderColor: colors.border }]}
                  >
                    <FileText size={13} color={colors.text} />
                    <Text style={[styles.pyqSecondaryBtnText, { color: colors.text }]}>View Paper</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      setSelectedPyq(paper);
                      setPyqSolution(null);
                      setPyqModalOpen(true);
                      setTimeout(() => handleSolvePaper(), 200);
                    }}
                    style={styles.pyqPrimaryBtn}
                  >
                    <Sparkles size={13} color="#ffffff" />
                    <Text style={styles.pyqPrimaryBtnText}>AI Solver</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* TAB 3: CRIMINAL LAW TRANSITION ENGINE */}
      {activeTab === 'transition' && (
        <ScrollView contentContainerStyle={styles.contentPad}>
          <Text style={[styles.sectionHeading, { color: colors.text }]}>
            Criminal Law Transition Engine ⚖️
          </Text>
          <Text style={[styles.sectionSubheading, { color: colors.textSecondary }]}>
            Compare provisions of Bharatiya Nyaya Sanhita (BNS), BNSS & BSA with IPC 1860, CrPC 1973 & IEA 1872.
          </Text>

          {/* Presets */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 10 }}>
            {[
              { label: 'Murder / Mob Lynching', q: 'IPC Section 300/302 vs BNS Section 100/101/103' },
              { label: 'Anticipatory Bail', q: 'CrPC Section 438 vs BNSS Section 482' },
              { label: 'Electronic Evidence', q: 'Indian Evidence Act Section 65B vs BSA Section 63' },
              { label: 'Audio-Video Seizure', q: 'BNSS Section 105 mandatory videography of search and seizure' },
            ].map((p, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => {
                  setTransQuery(p.q);
                  handleRunTransition(p.q);
                }}
                style={[styles.presetTransitionChip, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Text style={[styles.presetTransitionText, { color: colors.text }]}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Custom Query Input */}
          <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 4 }]}>
            <TextInput
              placeholder="e.g. IPC Section 420 vs BNS Section 318 cheating..."
              placeholderTextColor={colors.textSecondary}
              value={transQuery}
              onChangeText={setTransQuery}
              style={[styles.searchInput, { color: colors.text }]}
            />
            <TouchableOpacity
              onPress={() => handleRunTransition()}
              disabled={transLoading}
              style={styles.searchActionBtn}
            >
              {transLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Send size={14} color="#fff" />
              )}
            </TouchableOpacity>
          </View>

          {/* Transition Output */}
          {transResult && (
            <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.resultHeader}>
                <Sparkles size={14} color="#f59e0b" />
                <Text style={styles.resultTitle}>Comparative Statutory Breakdown</Text>
              </View>
              <Text style={[styles.resultBody, { color: colors.text }]}>{transResult}</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* TAB 4: PRELIMS MCQ DRILLS */}
      {activeTab === 'drills' && (
        <ScrollView contentContainerStyle={styles.contentPad}>
          <Text style={[styles.sectionHeading, { color: colors.text }]}>
            Bare Act MCQ Practice Drills 🎯
          </Text>
          <Text style={[styles.sectionSubheading, { color: colors.textSecondary }]}>
            Timed statutory multiple choice drills with verbatim citations from official gazette acts.
          </Text>

          <TouchableOpacity
            onPress={handleGenerateDrills}
            disabled={drillsLoading}
            style={styles.generateDrillBtn}
          >
            {drillsLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Sparkles size={16} color="#fff" />
                <Text style={styles.generateDrillBtnText}>Generate 5 MCQs on {drillSubject}</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Questions */}
          {drillQuestions.map((q, qIndex) => {
            const userChoice = selectedAnswers[qIndex];
            const isCorrect = userChoice === q.correctAnswer;
            return (
              <View
                key={qIndex}
                style={[styles.mcqCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Text style={[styles.mcqQuestionText, { color: colors.text }]}>
                  {qIndex + 1}. {q.question}
                </Text>
                {q.options?.map((opt: string, optIndex: number) => {
                  const isSelected = userChoice === optIndex;
                  return (
                    <TouchableOpacity
                      key={optIndex}
                      onPress={() => {
                        setSelectedAnswers((prev) => ({ ...prev, [qIndex]: optIndex }));
                      }}
                      style={[
                        styles.mcqOption,
                        {
                          borderColor: isSelected ? '#f59e0b' : colors.border,
                          backgroundColor: isSelected ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                        },
                      ]}
                    >
                      <Text style={[styles.mcqOptionText, { color: isSelected ? '#f59e0b' : colors.text }]}>
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}

                {userChoice !== undefined && (
                  <View style={styles.explanationBox}>
                    <Text style={{ color: isCorrect ? '#10b981' : '#f43f5e', fontWeight: 'bold', fontSize: 12 }}>
                      {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                    </Text>
                    <Text style={[styles.explanationText, { color: colors.textSecondary }]}>
                      Citation: {q.citation || q.explanation}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* MODAL 1: BARE ACT READER & AI SECTION EXPLORER */}
      <Modal
        visible={readerModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setReaderModalOpen(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: '#090d16' }]}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalBadgeText}>{selectedDoc?.category || 'BARE ACT'}</Text>
              <Text style={styles.modalTitleText} numberOfLines={1}>{selectedDoc?.title}</Text>
            </View>
            <TouchableOpacity onPress={() => setReaderModalOpen(false)} style={styles.modalCloseBtn}>
              <Text style={{ color: '#94a3b8', fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* In-Modal AI Section Explorer Bar */}
          <View style={styles.modalExplorerBar}>
            <View style={styles.modalExplorerInputWrap}>
              <Search size={14} color="#94a3b8" />
              <TextInput
                placeholder="Jump or explore section (e.g. 'Section 63', 'Dying declaration')..."
                placeholderTextColor="#64748b"
                value={docSearchQuery}
                onChangeText={setDocSearchQuery}
                style={styles.modalExplorerInput}
                onSubmitEditing={() => handleExploreSection()}
              />
            </View>
            <TouchableOpacity
              onPress={() => handleExploreSection()}
              disabled={exploringDoc || !docSearchQuery.trim()}
              style={styles.modalExploreBtn}
            >
              {exploringDoc ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Sparkles size={14} color="#fff" />
              )}
            </TouchableOpacity>
          </View>

          {/* Exam Hotspots Chips */}
          {(() => {
            const key = getActHotspotKey(selectedDoc);
            const chips = key && PRESET_HOTSPOTS[key] ? PRESET_HOTSPOTS[key] : [];
            if (chips.length === 0) return null;
            return (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modalHotspotScroll}>
                <Zap size={12} color="#f59e0b" style={{ alignSelf: 'center', marginRight: 4 }} />
                <Text style={styles.hotspotScrollLabel}>Hotspots:</Text>
                {chips.map((c, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => {
                      setDocSearchQuery(c.label);
                      handleExploreSection(c.q);
                    }}
                    style={styles.modalHotspotChip}
                  >
                    <Text style={styles.modalHotspotChipText}>{c.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            );
          })()}

          {/* Modal Content Body */}
          <ScrollView style={styles.modalScrollBody} contentContainerStyle={{ padding: 16 }}>
            {explorationResult ? (
              <View>
                <View style={styles.aiResultBanner}>
                  <Text style={styles.aiResultBannerText}>
                    AI Analysis: {explorationResult.query}
                  </Text>
                  <TouchableOpacity onPress={() => setExplorationResult(null)}>
                    <Text style={styles.backToStatuteText}>← Full Statute</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.statutoryBodyText}>{explorationResult.content}</Text>
              </View>
            ) : (
              <Text style={styles.statutoryBodyText}>
                {selectedDoc?.metadata?.paperContent ||
                  selectedDoc?.metadata?.fullText ||
                  selectedDoc?.metadata?.snippet ||
                  selectedDoc?.summary ||
                  'No document text content available.'}
              </Text>
            )}
          </ScrollView>

          {/* Modal Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              onPress={() => setReaderModalOpen(false)}
              style={styles.modalFooterCloseBtn}
            >
              <Text style={{ color: '#94a3b8', fontSize: 13 }}>Close</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                const text = explorationResult
                  ? explorationResult.content
                  : selectedDoc?.metadata?.paperContent || selectedDoc?.summary || '';
                Share.share({ message: text });
              }}
              style={styles.modalShareBtn}
            >
              <Text style={styles.modalShareBtnText}>Share / Copy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: PYQ PAPER VIEWER & AI SOLVER */}
      <Modal
        visible={pyqModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPyqModalOpen(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: '#090d16' }]}>
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.modalBadgeText, { color: '#c084fc' }]}>
                {selectedPyq?.state || 'PYQ'} • {selectedPyq?.metadata?.year || '2023'}
              </Text>
              <Text style={styles.modalTitleText} numberOfLines={1}>{selectedPyq?.title}</Text>
            </View>
            <TouchableOpacity onPress={() => setPyqModalOpen(false)} style={styles.modalCloseBtn}>
              <Text style={{ color: '#94a3b8', fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* AI Solver Trigger Header */}
          <View style={styles.pyqSolverBar}>
            <Text style={styles.pyqSolverBarTitle}>AI Judicial Model Answer Solver</Text>
            <TouchableOpacity
              onPress={handleSolvePaper}
              disabled={solvingPyq}
              style={styles.solvePaperBtn}
            >
              {solvingPyq ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Sparkles size={13} color="#fff" />
                  <Text style={styles.solvePaperBtnText}>Synthesize Solutions</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScrollBody} contentContainerStyle={{ padding: 16 }}>
            {solvingPyq ? (
              <View style={{ alignItems: 'center', padding: 40 }}>
                <ActivityIndicator size="large" color="#f59e0b" />
                <Text style={{ color: '#94a3b8', marginTop: 12, textAlign: 'center', fontSize: 13 }}>
                  Synthesizing Judicial Solutions & Model Answers against BNS / IPC rubrics...
                </Text>
              </View>
            ) : pyqSolution ? (
              <View>
                <View style={styles.aiResultBanner}>
                  <Text style={styles.aiResultBannerText}>Verified AI Judicial Solution</Text>
                </View>
                <Text style={styles.statutoryBodyText}>{pyqSolution.solution}</Text>
              </View>
            ) : (
              <View>
                <Text style={[styles.statutoryBodyText, { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]}>
                  {selectedPyq?.metadata?.paperContent ||
                    selectedPyq?.metadata?.fullText ||
                    selectedPyq?.metadata?.snippet ||
                    selectedPyq?.summary ||
                    'Paper content loading...'}
                </Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity onPress={() => setPyqModalOpen(false)} style={styles.modalFooterCloseBtn}>
              <Text style={{ color: '#94a3b8', fontSize: 13 }}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                const text = pyqSolution ? pyqSolution.solution : selectedPyq?.metadata?.paperContent || '';
                Share.share({ message: text });
              }}
              style={styles.modalShareBtn}
            >
              <Text style={styles.modalShareBtnText}>Share / Export</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: AUTONOMOUS PAST PAPER DISCOVERY AGENT */}
      <Modal
        visible={discoverModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setDiscoverModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.discoverDialog, { backgroundColor: '#0f172a' }]}>
            <Text style={styles.discoverDialogTitle}>Autonomous Past Paper Ingestion</Text>
            <Text style={styles.discoverDialogSub}>
              Discover authentic past examination papers for any state judiciary or prosecution exam.
            </Text>

            <Text style={styles.inputFieldLabel}>Target State / High Court</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 6 }}>
              {STATE_OPTIONS.filter((s) => s !== 'ALL').map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setDiscoverState(s)}
                  style={[
                    styles.stateSelectChip,
                    discoverState === s && styles.activeStateSelectChip,
                  ]}
                >
                  <Text style={[styles.stateSelectChipText, discoverState === s && { color: '#f59e0b' }]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputFieldLabel}>Examination Year</Text>
            <TextInput
              value={discoverYear}
              onChangeText={setDiscoverYear}
              keyboardType="numeric"
              style={styles.dialogTextInput}
            />

            <Text style={styles.inputFieldLabel}>Subject / Paper Area</Text>
            <TextInput
              value={discoverSubject}
              onChangeText={setDiscoverSubject}
              style={styles.dialogTextInput}
            />

            <View style={styles.dialogActions}>
              <TouchableOpacity
                onPress={() => setDiscoverModalOpen(false)}
                style={styles.dialogCancelBtn}
              >
                <Text style={{ color: '#94a3b8' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDiscoverPaper}
                disabled={discovering}
                style={styles.dialogSubmitBtn}
              >
                {discovering ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.dialogSubmitBtnText}>Run Discovery Agent</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 52 : 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 6, marginRight: 8 },
  headerTitleWrap: { flex: 1 },
  headerBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { fontSize: 16, fontWeight: 'bold' },
  headerSubtitle: { fontSize: 11, marginTop: 1 },
  refreshBtn: { padding: 8, borderWidth: 1, borderRadius: 8 },

  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  activeTabBtn: {
    borderBottomWidth: 2,
    borderBottomColor: '#f59e0b',
  },
  tabLabel: { fontSize: 11, fontWeight: '600' },

  contentPad: { padding: 14, paddingBottom: 40 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 13, padding: 0 },
  searchActionBtn: {
    backgroundColor: '#d97706',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },

  statuteCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  badgePill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgePillText: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: 'bold',
  },
  sectionCountText: { fontSize: 11, color: '#f59e0b', fontWeight: '500' },
  cardTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  cardSummary: { fontSize: 12, lineHeight: 17, marginBottom: 8 },

  hotspotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 8,
  },
  hotspotLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '500' },
  miniChip: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  miniChipText: { fontSize: 9, color: '#cbd5e1' },
  cardFooter: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', paddingTop: 8 },
  viewDocLink: { fontSize: 11, color: '#f59e0b', fontWeight: '600' },

  discoverBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  discoverBannerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  discoverBannerTitle: { color: '#fbbf24', fontWeight: 'bold', fontSize: 12 },
  discoverBannerSub: { color: '#cbd5e1', fontSize: 10, marginTop: 1 },
  discoverBtnPill: {
    backgroundColor: '#d97706',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  discoverBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 11 },

  pyqActionRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  pyqSecondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
  },
  pyqSecondaryBtnText: { fontSize: 12, fontWeight: '600' },
  pyqPrimaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#d97706',
    borderRadius: 8,
    paddingVertical: 8,
  },
  pyqPrimaryBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

  sectionHeading: { fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
  sectionSubheading: { fontSize: 12, lineHeight: 17, marginBottom: 12 },
  presetTransitionChip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  presetTransitionText: { fontSize: 11, fontWeight: '500' },

  resultCard: { borderWidth: 1, borderRadius: 12, padding: 14, marginTop: 12 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  resultTitle: { fontSize: 12, fontWeight: 'bold', color: '#f59e0b' },
  resultBody: { fontSize: 12, lineHeight: 18 },

  generateDrillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#d97706',
    borderRadius: 10,
    paddingVertical: 12,
    marginBottom: 16,
  },
  generateDrillBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  mcqCard: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 12 },
  mcqQuestionText: { fontSize: 13, fontWeight: 'bold', marginBottom: 10, lineHeight: 18 },
  mcqOption: { borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 6 },
  mcqOptionText: { fontSize: 12 },
  explanationBox: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  explanationText: { fontSize: 11, marginTop: 2, lineHeight: 16 },

  loadingBox: { padding: 30, alignItems: 'center' },
  loadingText: { fontSize: 12, marginTop: 8 },

  // Modals
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  modalBadgeText: { fontSize: 10, color: '#34d399', fontWeight: 'bold' },
  modalTitleText: { fontSize: 15, fontWeight: 'bold', color: '#fff', marginTop: 2 },
  modalCloseBtn: { padding: 6 },

  modalExplorerBar: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  modalExplorerInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  modalExplorerInput: { flex: 1, color: '#fff', fontSize: 12, marginLeft: 6, paddingVertical: 6 },
  modalExploreBtn: {
    backgroundColor: '#d97706',
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderRadius: 8,
  },

  modalHotspotScroll: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    backgroundColor: '#0f172a',
  },
  hotspotScrollLabel: { fontSize: 10, color: '#94a3b8', marginRight: 6, alignSelf: 'center' },
  modalHotspotChip: {
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#090d16',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 6,
  },
  modalHotspotChipText: { fontSize: 10, color: '#cbd5e1' },

  modalScrollBody: { flex: 1 },
  statutoryBodyText: { color: '#e2e8f0', fontSize: 12, lineHeight: 19 },
  aiResultBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 8,
    marginBottom: 10,
  },
  aiResultBannerText: { color: '#f59e0b', fontWeight: 'bold', fontSize: 12 },
  backToStatuteText: { color: '#94a3b8', fontSize: 11 },

  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    backgroundColor: '#0f172a',
  },
  modalFooterCloseBtn: { padding: 8 },
  modalShareBtn: {
    backgroundColor: '#d97706',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modalShareBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },

  pyqSolverBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  pyqSolverBarTitle: { color: '#f59e0b', fontSize: 12, fontWeight: 'bold' },
  solvePaperBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#d97706',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  solvePaperBtnText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },

  // Discovery Agent Dialog
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  discoverDialog: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#334155',
  },
  discoverDialogTitle: { color: '#f59e0b', fontWeight: 'bold', fontSize: 15, marginBottom: 4 },
  discoverDialogSub: { color: '#94a3b8', fontSize: 11, lineHeight: 16, marginBottom: 12 },
  inputFieldLabel: { color: '#cbd5e1', fontSize: 11, fontWeight: '600', marginTop: 8 },
  stateSelectChip: {
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
  },
  activeStateSelectChip: { borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.15)' },
  stateSelectChipText: { fontSize: 11, color: '#94a3b8' },
  dialogTextInput: {
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    color: '#fff',
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 4,
  },
  dialogActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 16 },
  dialogCancelBtn: { padding: 8 },
  dialogSubmitBtn: { backgroundColor: '#d97706', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  dialogSubmitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
});
