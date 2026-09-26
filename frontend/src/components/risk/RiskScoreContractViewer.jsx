import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  ShieldAlert,
  Search,
  Filter,
  LayoutGrid,
  List,
  Code2,
  Sparkles,
  TrendingUp,
  Copy,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Download,
  Check,
  Building,
  MapPin,
  Tag,
  FileCheck2,
  ChevronDown,
  Info,
  SlidersHorizontal,
  Layers,
} from 'lucide-react';
import RiskScoreCard from './RiskScoreCard';
import RiskScoreModal from './RiskScoreModal';
import RiskContractLiveTester from './RiskContractLiveTester';
import {
import {
  FLAG_METADATA,
  KNOWN_FLAGS,
  getRiskTier,
  getRiskTierMeta,
} from '../../data/riskContractData';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const RiskScoreContractViewer = ({ initialFilter = 'all' }) => {
  const [activeView, setActiveView] = useState('grid'); // 'grid' | 'table' | 'json' | 'tester'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRiskTier, setSelectedRiskTier] = useState(initialFilter); // 'all' | 'high' | 'medium' | 'low'
  const [selectedFlag, setSelectedFlag] = useState('all'); // 'all' | 'cost_outlier' | 'possible_duplicate' | 'delayed' | 'fund_mismatch' | 'multiple' | 'none'
  const [selectedState, setSelectedState] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [inspectingWork, setInspectingWork] = useState(null);
  const [copiedAllJson, setCopiedAllJson] = useState(false);
  
  const { currentRole, currentUser, isAuthenticated } = useAuth();
  const [liveRecords, setLiveRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch from backend
  React.useEffect(() => {
    async function fetchRiskScores() {
      setIsLoading(true);
      const session = { isAuthenticated, currentUser, currentRole };
      const res = await api.getRiskScores(session);
      if (res.ok && res.data) {
        setLiveRecords(res.data);
      }
      setIsLoading(false);
    }
    fetchRiskScores();
  }, [currentRole, currentUser, isAuthenticated]);

  // Extract unique states and categories from records
  const uniqueStates = useMemo(() => {
    const set = new Set(liveRecords.map((r) => r.state));
    return ['all', ...Array.from(set).sort()];
  }, [liveRecords]);

  const uniqueCategories = useMemo(() => {
    const set = new Set(liveRecords.map((r) => r.category));
    return ['all', ...Array.from(set).sort()];
  }, [liveRecords]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return liveRecords.filter((item) => {
      // Risk tier filter
      const tier = getRiskTier(item.risk_score);
      if (selectedRiskTier !== 'all' && tier !== selectedRiskTier) {
        return false;
      }

      // Flag filter
      if (selectedFlag === 'multiple' && item.flags.length < 2) return false;
      if (selectedFlag === 'none' && item.flags.length !== 0) return false;
      if (
        selectedFlag !== 'all' &&
        selectedFlag !== 'multiple' &&
        selectedFlag !== 'none' &&
        !item.flags.includes(selectedFlag)
      ) {
        return false;
      }

      // State filter
      if (selectedState !== 'all' && item.state !== selectedState) return false;

      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;

      // Text search query (work_id, ida, explanation, state, category)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = item.work_id.toLowerCase().includes(q);
        const matchIda = item.ida.toLowerCase().includes(q);
        const matchState = item.state.toLowerCase().includes(q);
        const matchCat = item.category.toLowerCase().includes(q);
        const matchExpl = item.explanation.toLowerCase().includes(q);
        const matchFlags = item.flags.some((f) => f.toLowerCase().includes(q));
        if (!matchId && !matchIda && !matchState && !matchCat && !matchExpl && !matchFlags) {
          return false;
        }
      }

      return true;
    });
  }, [selectedRiskTier, selectedFlag, selectedState, selectedCategory, searchQuery, liveRecords]);

  // Summary Metrics
  const stats = useMemo(() => {
    const total = liveRecords.length;
    const high = liveRecords.filter((r) => r.risk_score >= 71).length;
    const medium = liveRecords.filter((r) => r.risk_score >= 40 && r.risk_score < 71).length;
    const low = liveRecords.filter((r) => r.risk_score < 40).length;
    const multiFlag = liveRecords.filter((r) => r.flags.length >= 2).length;
    const avgScore = Math.round(
      liveRecords.reduce((acc, r) => acc + r.risk_score, 0) / (total || 1)
    );

    const flagCounts = {
      cost_outlier: liveRecords.filter((r) => r.flags.includes('cost_outlier')).length,
      possible_duplicate: liveRecords.filter((r) => r.flags.includes('possible_duplicate')).length,
      delayed: liveRecords.filter((r) => r.flags.includes('delayed')).length,
      fund_mismatch: liveRecords.filter((r) => r.flags.includes('fund_mismatch')).length,
    };

    return { total, high, medium, low, multiFlag, avgScore, flagCounts };
  }, [liveRecords]);

  const handleCopyFilteredJson = () => {
    navigator.clipboard.writeText(JSON.stringify(filteredRecords, null, 2));
    setCopiedAllJson(true);
    setTimeout(() => setCopiedAllJson(false), 2000);
  };

  const handleDownloadFilteredJson = () => {
    const blob = new Blob([JSON.stringify(filteredRecords, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mplads_risk_contract_records_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const resetFilters = () => {
    setSelectedRiskTier('all');
    setSelectedFlag('all');
    setSelectedState('all');
    setSelectedCategory('all');
    setSearchQuery('');
  };

  const hasActiveFilters =
    selectedRiskTier !== 'all' ||
    selectedFlag !== 'all' ||
    selectedState !== 'all' ||
    selectedCategory !== 'all' ||
    searchQuery.trim() !== '';

  return (
    <div className="space-y-6">
      {/* Non-Negotiable Privacy Protocol Notice */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-blue-500/10 border border-amber-300 dark:border-amber-800/60 flex items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-amber-900 dark:text-amber-200">
          <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            <strong>Demo Privacy Compliance:</strong> All risk scores, anomaly flags, MP designations, and agency names are 100% synthetic mock demonstration records conforming strictly to the official backend contract.
          </span>
        </div>
        <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100">
          CONTRACT v1.0
        </span>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Works */}
        <div
          onClick={() => {
            resetFilters();
          }}
          className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-400 cursor-pointer transition-all"
        >
          <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
            <span>Total Evaluated</span>
            <Layers className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-xl font-extrabold font-mono text-slate-900 dark:text-white mt-1">
            {stats.total}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Scored Works</div>
        </div>

        {/* High Risk */}
        <div
          onClick={() => {
            setSelectedRiskTier('high');
            setActiveView('grid');
          }}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            selectedRiskTier === 'high'
              ? 'bg-red-50 dark:bg-red-950/40 border-red-500 ring-2 ring-red-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-red-400'
          }`}
        >
          <div className="text-[11px] font-medium text-red-600 dark:text-red-400 flex items-center justify-between">
            <span>High Risk (&gt;70)</span>
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
          </div>
          <div className="text-xl font-extrabold font-mono text-red-600 dark:text-red-400 mt-1">
            {stats.high}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {Math.round((stats.high / (stats.total || 1)) * 100)}% of total
          </div>
        </div>

        {/* Moderate Risk */}
        <div
          onClick={() => {
            setSelectedRiskTier('medium');
            setActiveView('grid');
          }}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            selectedRiskTier === 'medium'
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-400'
          }`}
        >
          <div className="text-[11px] font-medium text-amber-600 dark:text-amber-400 flex items-center justify-between">
            <span>Moderate (40-70)</span>
            <Clock className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-extrabold font-mono text-amber-600 dark:text-amber-400 mt-1">
            {stats.medium}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Clarification items</div>
        </div>

        {/* Low Risk / Compliant */}
        <div
          onClick={() => {
            setSelectedRiskTier('low');
            setActiveView('grid');
          }}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            selectedRiskTier === 'low'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-400'
          }`}
        >
          <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
            <span>Low Risk (&lt;40)</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {stats.low}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Fully compliant</div>
        </div>

        {/* Multi-Flag Anomalies */}
        <div
          onClick={() => {
            setSelectedFlag('multiple');
            setActiveView('grid');
          }}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            selectedFlag === 'multiple'
              ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-purple-400'
          }`}
        >
          <div className="text-[11px] font-medium text-purple-600 dark:text-purple-400 flex items-center justify-between">
            <span>Multi-Flag (2+)</span>
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <div className="text-xl font-extrabold font-mono text-purple-600 dark:text-purple-400 mt-1">
            {stats.multiFlag}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Compound risks</div>
        </div>

        {/* Average Score */}
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
            <span>Avg Risk Index</span>
            <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-xl font-extrabold font-mono text-slate-900 dark:text-white mt-1">
            {stats.avgScore} <span className="text-xs text-slate-400 font-normal">/100</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Across monitored pool</div>
        </div>
      </div>

      {/* Flag Distribution Filter Chips */}
      <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" />
          <span>Anomaly Type:</span>
        </span>

        <button
          type="button"
          onClick={() => setSelectedFlag('all')}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
            selectedFlag === 'all'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          All Flags ({stats.total})
        </button>

        <button
          type="button"
          onClick={() => setSelectedFlag(KNOWN_FLAGS.COST_OUTLIER)}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${
            selectedFlag === KNOWN_FLAGS.COST_OUTLIER
              ? 'bg-red-600 text-white border-red-600 shadow-sm'
              : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800 hover:border-red-400'
          }`}
        >
          <TrendingUp className="w-3 h-3" />
          <span>Cost Outlier ({stats.flagCounts.cost_outlier})</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedFlag(KNOWN_FLAGS.POSSIBLE_DUPLICATE)}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${
            selectedFlag === KNOWN_FLAGS.POSSIBLE_DUPLICATE
              ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
              : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:border-purple-400'
          }`}
        >
          <Copy className="w-3 h-3" />
          <span>Possible Duplicate ({stats.flagCounts.possible_duplicate})</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedFlag(KNOWN_FLAGS.DELAYED)}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${
            selectedFlag === KNOWN_FLAGS.DELAYED
              ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:border-amber-400'
          }`}
        >
          <Clock className="w-3 h-3" />
          <span>Delayed ({stats.flagCounts.delayed})</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedFlag(KNOWN_FLAGS.FUND_MISMATCH)}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${
            selectedFlag === KNOWN_FLAGS.FUND_MISMATCH
              ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 hover:border-rose-400'
          }`}
        >
          <AlertTriangle className="w-3 h-3" />
          <span>Fund Mismatch ({stats.flagCounts.fund_mismatch})</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedFlag('multiple')}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${
            selectedFlag === 'multiple'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
              : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:border-indigo-400'
          }`}
        >
          <Sparkles className="w-3 h-3" />
          <span>Multi-Flag ({stats.multiFlag})</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedFlag('none')}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${
            selectedFlag === 'none'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:border-emerald-400'
          }`}
        >
          <CheckCircle2 className="w-3 h-3" />
          <span>Zero Flags ({stats.low})</span>
        </button>
      </div>

      {/* Search & Control Filter Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Work ID, IDA (e.g. IDA-001), State, Category, or Explanation..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Selectors and View Mode Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            {/* State Selector */}
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All States</option>
              {uniqueStates
                .filter((s) => s !== 'all')
                .map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
            </select>

            {/* Category Selector */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[180px] truncate"
            >
              <option value="all">All Categories</option>
              {uniqueCategories
                .filter((c) => c !== 'all')
                .map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
            </select>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="px-2.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Reset
              </button>
            )}

            {/* View Switcher Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setActiveView('grid')}
                title="Grid Card View"
                className={`p-1.5 rounded-lg transition-all ${
                  activeView === 'grid'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setActiveView('table')}
                title="Dense Data Table View"
                className={`p-1.5 rounded-lg transition-all ${
                  activeView === 'table'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <List className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setActiveView('json')}
                title="Raw JSON Contract Dossier"
                className={`p-1.5 rounded-lg transition-all ${
                  activeView === 'json'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Code2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setActiveView('tester')}
                title="Interactive Schema Validator & Payload Tester"
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                  activeView === 'tester'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tester</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Summary & Actions Bar */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            Showing <strong className="text-slate-900 dark:text-white font-mono">{filteredRecords.length}</strong> of{' '}
            <strong className="text-slate-900 dark:text-white font-mono">{liveRecords.length}</strong> contract-scored works
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyFilteredJson}
              className="px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1 font-medium"
            >
              {copiedAllJson ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedAllJson ? 'Copied All' : 'Copy All JSON'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadFilteredJson}
              className="px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 transition-colors flex items-center gap-1 font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Dossier</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main View Content */}
      {activeView === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-in">
          {filteredRecords.length > 0 ? (
            filteredRecords.map((record) => (
              <RiskScoreCard
                key={record.work_id}
                data={record}
                onSelect={(item) => setInspectingWork(item)}
              />
            ))
          ) : (
            <div className="col-span-full p-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-slate-400 space-y-3">
              <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto opacity-70" />
              <div className="text-base font-bold text-slate-800 dark:text-slate-200">
                No matching works found
              </div>
              <p className="text-xs max-w-sm mx-auto">
                No contract records match the active combination of filters.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      )}

      {activeView === 'table' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 uppercase tracking-wider font-semibold font-mono text-[11px]">
                <tr>
                  <th className="py-3 px-4">Work ID / IDA</th>
                  <th className="py-3 px-4">State & Category</th>
                  <th className="py-3 px-4">Risk Score</th>
                  <th className="py-3 px-4">Anomaly Flags</th>
                  <th className="py-3 px-4 max-w-md">Human-Readable Explanation</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRecords.map((item) => {
                  const tierMeta = getRiskTierMeta(item.risk_score);

                  return (
                    <tr
                      key={item.work_id}
                      onClick={() => setInspectingWork(item)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      {/* Work ID + IDA */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{item.work_id}</span>
                        </div>
                        <div className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                          IDA: {item.ida}
                        </div>
                      </td>

                      {/* State & Category */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{item.state}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[180px] mt-0.5">
                          {item.category}
                        </div>
                      </td>

                      {/* Risk Score */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-extrabold text-xs ${tierMeta.badgeColor}`}>
                            {item.risk_score}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${tierMeta.badgeBg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${tierMeta.dotColor}`} />
                            {tierMeta.label}
                          </span>
                        </div>
                      </td>

                      {/* Multi Flags */}
                      <td className="py-3.5 px-4">
                        {item.flags.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[220px]">
                            {item.flags.map((f) => {
                              const meta = FLAG_METADATA[f] || {
                                label: f,
                                badgeClass: 'bg-slate-100 text-slate-700',
                              };
                              return (
                                <span
                                  key={f}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${meta.badgeClass}`}
                                >
                                  {meta.label}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Compliant
                          </span>
                        )}
                      </td>

                      {/* Explanation */}
                      <td className="py-3.5 px-4 max-w-md">
                        <p className="text-slate-700 dark:text-slate-300 text-xs line-clamp-2 italic">
                          &ldquo;{item.explanation}&rdquo;
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectingWork(item);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-colors"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeView === 'json' && (
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-fade-in shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white font-mono">
                Filtered Risk Score Contract Dossier ({filteredRecords.length} items)
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Exact pure JSON representation matching the ML model / backend contract.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyFilteredJson}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                {copiedAllJson ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedAllJson ? 'Copied' : 'Copy All'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadFilteredJson}
                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download JSON</span>
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-xs border border-slate-800 overflow-x-auto max-h-[500px] shadow-inner leading-relaxed">
            <pre>{JSON.stringify(filteredRecords, null, 2)}</pre>
          </div>
        </div>
      )}

      {activeView === 'tester' && (
        <div className="animate-fade-in">
          <RiskContractLiveTester
            onSelectWork={(item) => setInspectingWork(item)}
          />
        </div>
      )}

      {/* Deep-Dive Inspection Modal */}
      {inspectingWork && (
        <RiskScoreModal
          item={inspectingWork}
          onClose={() => setInspectingWork(null)}
        />
      )}
    </div>
  );
};

RiskScoreContractViewer.propTypes = {
  initialFilter: PropTypes.string,
};

export default RiskScoreContractViewer;
