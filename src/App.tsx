import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: ReturnType<typeof createClient> | null = null;

try {
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
  } else {
    supabase = createClient(supabaseUrl, supabaseKey);
  }
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
}

const DEFAULT_SCORING_PROMPT = `You are an innovation strategist for the World Bank ITS Innovation Lab, scoring a project for innovation engagement potential.

The Lab creates value through three capabilities:
1. STRATEGIC FORESIGHT - Future-proofing investments, Three Horizons thinking, scenario planning, regulatory sandboxes
2. EMERGING TECHNOLOGIES - AI/ML, Blockchain/DLT, IoT/Digital Twins, Drones/UAVs, Digital Public Infrastructure
3. COLLECTIVE INTELLIGENCE - Innovation challenges, hackathons, startup ecosystem engagement

PROJECT TO ANALYZE:
- Name: [[project_name]]
- Country: [[country]]
- Amount: $[[amount]]
- Domain: [[domain]]

---

## STEP 1: CONDUCT WEB RESEARCH

Before scoring, you MUST perform the following three web searches. Execute each search and record the key findings.

**Search A - Emerging Technology:**
Search for: [[domain]] emerging technology innovation

**Search B - Future Trends & Foresight:**
Search for: [[domain]] future trends 2030 disruption

**Search C - Collective Intelligence & Ecosystem:**
Search for: [[domain]] innovation challenge hackathon startup [[country]]

---

## STEP 2: ANALYZE AND SCORE

After completing all three searches, synthesize your findings to evaluate the project's potential for Innovation Lab engagement.

RESPOND WITH VALID JSON ONLY (no markdown code blocks):

{
  "emerging_tech": {
    "score": <1-10>,
    "technologies": ["<relevant tech found>"],
    "applications": ["<how it applies to this project>"],
    "evidence": "<1-2 sentence summary of findings>"
  },
  "foresight": {
    "score": <1-10>,
    "disruptions": ["<anticipated changes in this domain>"],
    "horizon": "<near-term|medium-term|long-term>",
    "evidence": "<1-2 sentence summary>"
  },
  "collective_intelligence": {
    "score": <1-10>,
    "ecosystem_activity": "<high|medium|low>",
    "examples": ["<relevant challenges, hackathons, or initiatives found>"],
    "evidence": "<1-2 sentence summary>"
  },
  "relevance": {
    "score": <1-10>,
    "rationale": "<why these innovations apply to this specific project and country>"
  },
  "top_opportunities": [
    {
      "opportunity": "<specific innovation opportunity>",
      "dimension": "<foresight|emerging_tech|collective_intel>",
      "approach": "<Proof of Value|Foresight Workshop|Innovation Challenge|Hackathon|Scoping Study>"
    }
  ],
  "key_insight": "<one sentence strategic recommendation for Lab engagement>"
}`;

const DEFAULT_REPORT_PROMPT = `INNOVATION OPPORTUNITY ASSESSMENT REPORT GENERATOR

This feature generates an elegantly formatted, downloadable Innovation Opportunity Report for all scored projects.

## REPORT REQUIREMENTS

1. **Format**: Clean HTML document styled for professional presentation (not markdown)
2. **Structure**: One page per project, projects listed in descending score order
3. **Content**: Methodology explanation + detailed justification for each project's score
4. **Download**: User can download as HTML file (which can be printed to PDF)

---

## REPORT STRUCTURE

### COVER PAGE
- World Bank Group · ITS Innovation Labs branding
- Report title: "Innovation Opportunity Assessment Report"
- Subtitle: "Strategic Analysis of World Bank Projects for Technology and Innovation Engagement"
- Key statistics:
  * Total projects analyzed
  * Number of high-priority projects (score ≥ 7)
  * Total financing amount
- Generation date

### METHODOLOGY PAGE
Explains the scoring system:
- **Strategic Foresight (35% weight)**: Need for future-proofing and anticipatory planning
  * Key signals: Long implementation horizons, infrastructure lock-in risk, policy/strategy components
- **Emerging Technology (35% weight)**: Applicable frontier technologies (AI/ML, Blockchain, IoT, Drones, DPI)
  * Key signals: Proven applications, solution maturity, relevance to challenges
- **Collective Intelligence (30% weight)**: Potential for challenges, hackathons, ecosystem engagement
  * Key signals: Startup ecosystem activity, precedent challenges, multi-stakeholder complexity
- **Score Formula**: Base × Relevance × Scale (max 10)

### EXECUTIVE SUMMARY PAGE
Table with all projects sorted by score (highest to lowest):
- Rank number
- Project name and ID
- Country
- Financing amount
- Overall score (color-coded circle)
- Primary dimension badge

### INDIVIDUAL PROJECT PAGES (one per project)
Each project gets a detailed page with:

**Header Section:**
- Project rank (e.g., "Project #1 of 25")
- Project name (large, serif font)
- Metadata: Country, financing amount, project ID
- Overall score (large color-coded circle)
- Primary dimension badge

**Score Breakdown:**
Three cards showing scores for each dimension:
- Dimension name and score (large number)
- Progress bar (color-coded)
- Evidence summary text

**Research Findings Grid:**
Four-card grid showing:
- Technologies Identified (from emerging_tech.technologies)
- Anticipated Disruptions (from foresight.disruptions)
- Ecosystem Activity (from collective_intelligence.examples)
- Relevance Assessment (from relevance.rationale)

**Recommended Engagement Opportunities:**
Numbered list of top opportunities (if available):
- Opportunity description
- Approach and dimension tag

**Key Insight:**
Strategic recommendation quote (if available)

**Footer:**
- World Bank ITS Innovation Labs
- Page number (e.g., "Page 4 of 28")

---

## DESIGN SPECIFICATIONS

**Colors:**
- World Bank Dark Blue: #002244
- World Bank Light Blue: #009FDA
- Green (high scores ≥7): #059669
- Amber (medium scores 5-6.9): #D97706
- Gray (low scores <5): #6B7280

**Typography:**
- Headers: Source Serif Pro
- Body: Source Sans Pro
- Weights: 300, 400, 600, 700

**Layout:**
- Max width: 850px
- Professional spacing with consistent padding
- Page breaks between major sections
- Print-optimized CSS

**Score Visualization:**
- Circular badges for overall scores
- Progress bars for dimension breakdown
- Color-coding throughout (green/amber/gray)

---

## DOWNLOAD OPTIONS

1. **Download HTML**: User clicks to download the complete report as an HTML file
   - Filename format: Innovation_Opportunity_Report_YYYY-MM-DD.html
   - Self-contained with embedded CSS
   - Can be shared via email or uploaded to SharePoint

2. **Print to PDF**: User clicks to open print dialog
   - Opens report in new window
   - Triggers browser print dialog
   - User can save as PDF with proper page breaks

---

## REPORT FEATURES

✓ Includes ALL scored projects (not limited to 5)
✓ Automatically sorts by score (highest to lowest)
✓ Professional World Bank branding and color scheme
✓ Responsive design optimized for both screen and print
✓ Self-contained HTML (no external dependencies)
✓ Color-coded scores and visualizations
✓ Detailed evidence and justifications
✓ Strategic recommendations for each project
✓ Ready for stakeholder presentations`;

const REGIONS = [
  'All',
  'Africa',
  'East Asia and Pacific',
  'Europe and Central Asia',
  'Latin America and Caribbean',
  'Middle East and North Africa',
  'South Asia'
];

interface Project {
  id: string;
  project_name: string;
  countryname: string | string[];
  regionname: string;
  status: string;
  totalamt: string;
  sector1?: { Name: string };
  mjsector1Name?: string;
  theme1?: { Name: string };
}

interface Score {
  emerging_tech: {
    score: number;
    technologies: string[];
    applications: string[];
    evidence: string;
  };
  foresight: {
    score: number;
    disruptions: string[];
    horizon: string;
    evidence: string;
  };
  collective_intelligence: {
    score: number;
    ecosystem_activity: string;
    examples: string[];
    evidence: string;
  };
  relevance: {
    score: number;
    rationale: string;
  };
  overall_score: number;
  top_opportunities: Array<{
    opportunity: string;
    dimension: string;
    approach: string;
  }>;
  key_insight: string;
}

function App() {
  console.log('App component mounting...');
  console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
  console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
  console.log('Supabase client:', supabase ? 'INITIALIZED' : 'NULL');

  const [filters, setFilters] = useState({
    region: 'All',
    statuses: ['Active', 'Pipeline'],
    yearFrom: '',
    yearTo: '',
    keyword: ''
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [scores, setScores] = useState<Record<string, Score>>({});
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [apiKeys, setApiKeys] = useState({ openai: '', anthropic: '' });
  const [activeModel, setActiveModel] = useState('demo');
  const [customModel, setCustomModel] = useState('');
  const [customModels, setCustomModels] = useState<string[]>([]);
  const [aiTest, setAiTest] = useState<{ provider: string; status: string; message: string } | null>(null);
  const [testingAi, setTestingAi] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scoringPrompt, setScoringPrompt] = useState(DEFAULT_SCORING_PROMPT);
  const [reportPrompt, setReportPrompt] = useState(DEFAULT_REPORT_PROMPT);
  const [reportOpen, setReportOpen] = useState(false);
  const [report, setReport] = useState('');
  const [mockMode, setMockMode] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [apiTest, setApiTest] = useState<{ status: string; message: string; data?: any } | null>(null);
  const [testing, setTesting] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [webSearchTest, setWebSearchTest] = useState<{ status: string; message: string; searchResults?: string } | null>(null);
  const [testingWebSearch, setTestingWebSearch] = useState(false);
  const [viewingResearch, setViewingResearch] = useState<{ projectId: string; projectName: string; results: any } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (page > 1) {
      searchProjects();
    }
  }, [page]);

  const loadSettings = async () => {
    if (!supabase) return;
    const { data } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', 'default')
      .maybeSingle() as any;

    if (data) {
      setApiKeys({
        openai: data.openai_key || '',
        anthropic: data.anthropic_key || ''
      });
      setActiveModel(data.active_model || 'demo');
      setCustomModels(data.custom_models || []);
      if (data.scoring_prompt) setScoringPrompt(data.scoring_prompt);
      if (data.report_prompt) setReportPrompt(data.report_prompt);
    }
  };

  const saveSettings = async () => {
    if (!supabase) return;
    setSaving(true);
    try {
      await (supabase.from('user_settings') as any).upsert({
        user_id: 'default',
        openai_key: apiKeys.openai,
        anthropic_key: apiKeys.anthropic,
        active_model: activeModel,
        custom_models: customModels,
        scoring_prompt: scoringPrompt,
        report_prompt: reportPrompt,
        updated_at: new Date().toISOString()
      });
      alert('Settings saved successfully!');
    } catch (error: any) {
      alert('Failed to save settings: ' + error.message);
    }
    setSaving(false);
  };

  const addCustomModel = () => {
    if (customModel.trim() && !customModels.includes(customModel.trim())) {
      setCustomModels([...customModels, customModel.trim()]);
      setCustomModel('');
    }
  };

  const removeCustomModel = (model: string) => {
    setCustomModels(customModels.filter(m => m !== model));
    if (activeModel === model) {
      setActiveModel('demo');
    }
  };

  const loadScores = async (projectIds: string[]) => {
    if (!supabase || projectIds.length === 0) return;
    const { data } = await supabase
      .from('project_scores')
      .select('*')
      .in('project_id', projectIds);
    if (data) {
      const scoresMap: Record<string, Score> = { ...scores };
      data.forEach((score: any) => {
        if (score.score_data) {
          scoresMap[score.project_id] = score.score_data;
        }
      });
      setScores(scoresMap);
    }
  };

  const searchProjects = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.region !== 'All') params.set('regions', filters.region);
      if (filters.statuses.length > 0) params.set('statuses', filters.statuses.join(','));

      // Apply year filters only if both are set
      if (filters.yearFrom && filters.yearTo) {
        params.set('yearFrom', filters.yearFrom);
        params.set('yearTo', filters.yearTo);
      }

      if (filters.keyword) params.set('keyword', filters.keyword);
      params.set('page', page.toString());
      params.set('pageSize', '50');

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/wb-projects?${params}`;
      console.log('Fetching projects from:', apiUrl);

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        }
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Projects data:', data);
      console.log('Total from API:', data.total);
      console.log('Projects array length:', data.projects?.length || 0);
      const loadedProjects = data.projects || [];

      // Debug: Log status distribution
      const statusCounts: Record<string, number> = {};
      loadedProjects.forEach((p: any) => {
        const status = p.status || 'NO_STATUS';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      console.log('Status distribution in loaded projects:', statusCounts);
      console.log('Active filters:', filters);

      setProjects(loadedProjects);
      setTotal(data.total || 0);
      setMockMode(data.mock || false);
    } catch (error: any) {
      console.error('Search error:', error);
      alert(`Failed to load projects: ${error.message}\n\nPlease check that the edge functions are deployed correctly.`);
      setProjects([]);
      setTotal(0);
    }
    setLoading(false);
  };

  const handleSearch = () => {
    setPage(1);
    setScores({});
    setSelected(new Set());
    searchProjects();
  };

  const handleClear = () => {
    setFilters({
      region: 'All',
      statuses: ['Active', 'Pipeline'],
      yearFrom: '',
      yearTo: '',
      keyword: ''
    });
    setPage(1);
    setScores({});
    setSelected(new Set());
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  const toggleSelectAll = () => {
    if (selected.size === projects.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(projects.map(p => p.id)));
    }
  };

  const scoreSelected = async () => {
    if (selected.size === 0) {
      alert('Please select at least one project');
      return;
    }

    setScoring(true);
    try {
      const selectedProjects = projects.filter(p => selected.has(p.id));
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/score-projects`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          projects: selectedProjects,
          prompt: scoringPrompt,
          model: activeModel,
          apiKey: activeModel.startsWith('gpt') ? apiKeys.openai : apiKeys.anthropic
        })
      });
      const data = await response.json();

      const newScores = { ...scores };
      for (const result of data.results) {
        if (result.success) {
          newScores[result.projectId] = result;

          const project = selectedProjects.find(p => p.id === result.projectId);
          if (project && supabase) {
            await (supabase.from('project_scores') as any).upsert({
              project_id: result.projectId,
              project_name: project.project_name,
              country: Array.isArray(project.countryname) ? project.countryname.join(', ') : project.countryname,
              region: project.regionname,
              sector: project.sector1?.Name || project.mjsector1Name,
              amount: project.totalamt,
              status: project.status,
              score_data: result,
              web_search_results: result.web_search_results || null,
              updated_at: new Date().toISOString()
            });
          }
        }
      }
      setScores(newScores);

      const failed = data.results.filter((r: any) => !r.success).length;
      if (failed > 0) {
        alert(`Scored ${data.results.length - failed} projects successfully. ${failed} failed.`);
      }
    } catch (error: any) {
      alert('Scoring failed: ' + error.message);
    }
    setScoring(false);
  };

  const generateReport = async () => {
    const scoredProjects = projects.filter(p => scores[p.id]).map(p => ({
      ...p,
      score: scores[p.id]
    }));

    if (scoredProjects.length === 0) {
      alert('Please score at least one project first');
      return;
    }

    setGenerating(true);
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-report`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          projects: scoredProjects,
          generatedDate: new Date().toISOString()
        })
      });
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setReport(data.html);
      setReportOpen(true);
    } catch (error: any) {
      alert('Report generation failed: ' + error.message);
    }
    setGenerating(false);
  };

  const viewWebResearch = async (projectId: string) => {
    if (!supabase) return;

    const { data } = await supabase
      .from('project_scores')
      .select('project_name, web_search_results')
      .eq('project_id', projectId)
      .maybeSingle() as any;

    if (data && data.web_search_results) {
      setViewingResearch({
        projectId,
        projectName: data.project_name,
        results: data.web_search_results
      });
    } else {
      alert('No web research data available for this project');
    }
  };

  const downloadReport = () => {
    const blob = new Blob([report], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Innovation_Opportunity_Report_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const printReport = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(report);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  const formatAmount = (amt: string) => {
    const num = parseInt((amt || '0').replace(/,/g, ''), 10);
    if (num >= 1000000000) return `$${(num / 1000000000).toFixed(1)}B`;
    if (num >= 1000000) return `$${(num / 1000000).toFixed(0)}M`;
    return 'TBD';
  };

  const formatCountry = (country: string | string[]) => {
    return Array.isArray(country) ? country.join(', ') : country || 'Unknown';
  };

  const sortProjects = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedProjects = () => {
    if (!sortConfig) return projects;

    const sorted = [...projects].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.key) {
        case 'name':
          aValue = (a.project_name || '').toLowerCase();
          bValue = (b.project_name || '').toLowerCase();
          break;
        case 'country':
          aValue = formatCountry(a.countryname).toLowerCase();
          bValue = formatCountry(b.countryname).toLowerCase();
          break;
        case 'region':
          aValue = (a.regionname || '').toLowerCase();
          bValue = (b.regionname || '').toLowerCase();
          break;
        case 'sector':
          aValue = (a.sector1?.Name || a.mjsector1Name || '').toLowerCase();
          bValue = (b.sector1?.Name || b.mjsector1Name || '').toLowerCase();
          break;
        case 'amount':
          aValue = parseInt((a.totalamt || '0').replace(/,/g, ''), 10);
          bValue = parseInt((b.totalamt || '0').replace(/,/g, ''), 10);
          break;
        case 'status':
          aValue = (a.status || '').toLowerCase();
          bValue = (b.status || '').toLowerCase();
          break;
        case 'score':
          aValue = scores[a.id]?.overall_score || 0;
          bValue = scores[b.id]?.overall_score || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  };

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return <span className="text-gray-400 ml-1">↕</span>;
    }
    return <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const colors: Record<string, string> = {
      'Active': 'bg-green-100 text-green-800',
      'Pipeline': 'bg-blue-100 text-blue-800',
      'Dropped': 'bg-gray-100 text-gray-800'
    };
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${colors[status] || colors['Dropped']}`}>
        {status}
      </span>
    );
  };

  const ScoreBadge = ({ score }: { score?: Score }) => {
    if (!score) return <span className="text-gray-400">—</span>;

    const overall = score.overall_score;
    const color = overall >= 7 ? 'bg-green-500' : overall >= 5 ? 'bg-yellow-500' : 'bg-gray-400';

    const primaryDimension = () => {
      const tech = score.emerging_tech?.score || 0;
      const foresight = score.foresight?.score || 0;
      const collective = score.collective_intelligence?.score || 0;

      if (tech >= foresight && tech >= collective) return { name: 'Emerging Technology', icon: '⚡' };
      if (foresight >= collective) return { name: 'Strategic Foresight', icon: '🔮' };
      return { name: 'Collective Intelligence', icon: '🤝' };
    };

    const primary = primaryDimension();

    return (
      <div className="relative group">
        <div className={`w-10 h-10 ${color} rounded-full flex items-center justify-center text-white font-bold cursor-pointer`}>
          {overall.toFixed(1)}
        </div>
        <div className="absolute hidden group-hover:block bg-gray-900 text-white text-xs rounded p-2 -top-24 left-1/2 transform -translate-x-1/2 w-56 z-10">
          <div className="font-semibold mb-1">{primary.icon} {primary.name}</div>
          <div>Tech: {score.emerging_tech?.score.toFixed(1) || '?'}</div>
          <div>Foresight: {score.foresight?.score.toFixed(1) || '?'}</div>
          <div>Collective: {score.collective_intelligence?.score.toFixed(1) || '?'}</div>
          <div className="mt-1 text-gray-300 text-xs italic">{score.key_insight}</div>
        </div>
      </div>
    );
  };

  const testAiModel = async (provider: 'openai' | 'anthropic') => {
    setTestingAi(true);
    setAiTest(null);

    const apiKey = provider === 'openai' ? apiKeys.openai : apiKeys.anthropic;
    if (!apiKey) {
      setAiTest({
        provider,
        status: 'error',
        message: 'API key not provided'
      });
      setTestingAi(false);
      return;
    }

    try {
      const testPrompt = 'Say "API test successful" in exactly three words.';

      if (provider === 'openai') {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: testPrompt }],
            max_tokens: 10
          })
        });

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error.message);
        }

        setAiTest({
          provider,
          status: 'success',
          message: `OpenAI API connected successfully. Response: "${data.choices[0].message.content}"`
        });
      } else {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 10,
            messages: [{ role: 'user', content: testPrompt }]
          })
        });

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error.message);
        }

        setAiTest({
          provider,
          status: 'success',
          message: `Anthropic API connected successfully. Response: "${data.content[0].text}"`
        });
      }
    } catch (error: any) {
      setAiTest({
        provider,
        status: 'error',
        message: `Failed: ${error.message}`
      });
    }

    setTestingAi(false);
  };

  const testWebSearch = async () => {
    setTestingWebSearch(true);
    setWebSearchTest(null);

    if (!apiKeys.openai) {
      setWebSearchTest({
        status: 'error',
        message: 'OpenAI API key required for web search test'
      });
      setTestingWebSearch(false);
      return;
    }

    try {
      const testQuery = 'What are the latest AI trends in agriculture 2025?';
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKeys.openai}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-search-preview-2025-03-11',
          messages: [{
            role: 'user',
            content: `Search the web for: "${testQuery}"\n\nProvide 3 specific, recent findings with sources. Keep response under 150 words.`
          }],
          web_search_options: {},
          max_tokens: 300
        })
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      const searchResults = data.choices[0].message.content;
      const hasRecentInfo = searchResults.toLowerCase().includes('2025') ||
                           searchResults.toLowerCase().includes('2024');

      setWebSearchTest({
        status: hasRecentInfo ? 'success' : 'warning',
        message: hasRecentInfo
          ? 'Web search working! Found recent information from the web.'
          : 'API responded but results may not include recent web search data.',
        searchResults
      });
    } catch (error: any) {
      setWebSearchTest({
        status: 'error',
        message: `Web search test failed: ${error.message}`
      });
    }

    setTestingWebSearch(false);
  };

  const testWorldBankAPI = async () => {
    setTesting(true);
    setApiTest(null);

    try {
      const startTime = Date.now();
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/wb-projects?page=1&pageSize=1`;
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        }
      });
      const responseTime = `${Date.now() - startTime}ms`;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.mock) {
        setApiTest({
          status: 'warning',
          message: 'World Bank API is not responding. Using demo data instead.',
          data: {
            total: data.total || 0,
            responseTime
          }
        });
      } else {
        setApiTest({
          status: 'success',
          message: 'Successfully connected to World Bank API.',
          data: {
            total: data.total || 0,
            responseTime
          }
        });
      }
    } catch (error: any) {
      setApiTest({
        status: 'error',
        message: `Failed to connect: ${error.message}`
      });
    }

    setTesting(false);
  };

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md p-6 bg-white rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Configuration Error</h1>
          <p className="text-gray-700 mb-4">
            The application is missing required environment variables. Please ensure the following are set:
          </p>
          <ul className="list-disc list-inside text-gray-600 mb-4">
            <li>VITE_SUPABASE_URL</li>
            <li>VITE_SUPABASE_ANON_KEY</li>
          </ul>
          <p className="text-sm text-gray-500">
            Current values:
            <br />URL: {supabaseUrl || 'NOT SET'}
            <br />Key: {supabaseKey ? '***' + supabaseKey.slice(-8) : 'NOT SET'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#002244] text-white p-4 shadow-lg">
        <div className="max-w-[1600px] mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">WB Project Opportunity Analyzer</h1>
            <p className="text-sm text-gray-300">ITS Innovation Labs</p>
          </div>
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 hover:bg-[#003366] rounded transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      <div className="flex max-w-[1600px] mx-auto">
        <aside className="w-72 bg-white p-6 shadow-md min-h-screen">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">Filters</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
            <select
              value={filters.region}
              onChange={(e) => setFilters({ ...filters, region: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-[#009FDA] focus:border-transparent"
            >
              {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            {['Active', 'Pipeline'].map(status => (
              <label key={status} className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={filters.statuses.includes(status)}
                  onChange={(e) => {
                    const newStatuses = e.target.checked
                      ? [...filters.statuses, status]
                      : filters.statuses.filter(s => s !== status);
                    setFilters({ ...filters, statuses: newStatuses });
                  }}
                  className="mr-2"
                />
                <span className="text-sm">{status}</span>
              </label>
            ))}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Approval Date Range</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="From (e.g. 2020)"
                value={filters.yearFrom}
                onChange={(e) => setFilters({ ...filters, yearFrom: e.target.value })}
                className="w-1/2 border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-[#009FDA] focus:border-transparent"
              />
              <input
                type="number"
                placeholder="To (e.g. 2025)"
                value={filters.yearTo}
                onChange={(e) => setFilters({ ...filters, yearTo: e.target.value })}
                className="w-1/2 border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-[#009FDA] focus:border-transparent"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Keyword</label>
            <input
              type="text"
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
              placeholder="e.g. digital"
              className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-[#009FDA] focus:border-transparent"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSearch}
              className="flex-1 bg-[#009FDA] text-white px-4 py-2 rounded hover:bg-[#0088cc] transition"
            >
              Search
            </button>
            <button
              onClick={handleClear}
              className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition"
            >
              Clear
            </button>
          </div>
        </aside>

        <main className="flex-1 p-6">
          {mockMode && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4">
              Using demo data (World Bank API unavailable)
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">
                Found <span className="font-semibold">{total}</span> projects
              </span>
              <div className="flex gap-2">
                <button
                  onClick={scoreSelected}
                  disabled={selected.size === 0 || scoring}
                  className="bg-[#28A745] text-white px-4 py-2 rounded hover:bg-green-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {scoring ? 'Scoring...' : 'Score Selected'}
                </button>
                <button
                  onClick={generateReport}
                  disabled={Object.keys(scores).length === 0 || generating}
                  className="bg-[#002244] text-white px-4 py-2 rounded hover:bg-[#003366] transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {generating ? 'Generating...' : 'Generate Report'}
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : projects.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-500 text-lg mb-2">No projects found</p>
              <p className="text-gray-400 text-sm">Try adjusting your filters or click &quot;Clear Filters&quot;</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="p-3 text-left">
                        <input
                          type="checkbox"
                          checked={selected.size === projects.length && projects.length > 0}
                          onChange={toggleSelectAll}
                        />
                      </th>
                      <th className="p-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 select-none" onClick={() => sortProjects('name')}>
                        Project<SortIcon columnKey="name" />
                      </th>
                      <th className="p-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 select-none" onClick={() => sortProjects('country')}>
                        Country<SortIcon columnKey="country" />
                      </th>
                      <th className="p-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 select-none" onClick={() => sortProjects('region')}>
                        Region<SortIcon columnKey="region" />
                      </th>
                      <th className="p-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 select-none" onClick={() => sortProjects('sector')}>
                        Sector<SortIcon columnKey="sector" />
                      </th>
                      <th className="p-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 select-none" onClick={() => sortProjects('amount')}>
                        Amount<SortIcon columnKey="amount" />
                      </th>
                      <th className="p-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 select-none" onClick={() => sortProjects('status')}>
                        Status<SortIcon columnKey="status" />
                      </th>
                      <th className="p-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 select-none" onClick={() => sortProjects('score')}>
                        Score<SortIcon columnKey="score" />
                      </th>
                      <th className="p-3 text-left text-sm font-semibold text-gray-700">
                        Research
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {getSortedProjects().map((project) => (
                      <tr key={project.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selected.has(project.id)}
                            onChange={() => toggleSelect(project.id)}
                          />
                        </td>
                        <td className="p-3">
                          <a
                            href={`https://projects.worldbank.org/en/projects-operations/project-detail/${project.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#009FDA] hover:underline font-medium"
                          >
                            {project.project_name || 'Unnamed Project'}
                          </a>
                          <div className="text-xs text-gray-500">{project.id}</div>
                        </td>
                        <td className="p-3 text-sm">{formatCountry(project.countryname)}</td>
                        <td className="p-3 text-sm">{project.regionname}</td>
                        <td className="p-3 text-sm">{project.sector1?.Name || project.mjsector1Name || 'N/A'}</td>
                        <td className="p-3 text-sm font-semibold">{formatAmount(project.totalamt)}</td>
                        <td className="p-3">
                          <StatusBadge status={project.status} />
                        </td>
                        <td className="p-3">
                          <ScoreBadge score={scores[project.id]} />
                        </td>
                        <td className="p-3">
                          {scores[project.id] && (
                            <button
                              onClick={() => viewWebResearch(project.id)}
                              className="text-blue-600 hover:text-blue-800 text-sm underline"
                              title="View web research data used for scoring"
                            >
                              Research
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {total > 50 && (
                <div className="mt-4 flex justify-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-white border rounded hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2">
                    Page {page} of {Math.ceil(total / 50)}
                  </span>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={page >= Math.ceil(total / 50)}
                    className="px-4 py-2 bg-white border rounded hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {settingsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Settings</h2>
              <button
                onClick={() => setSettingsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-700">External APIs</h3>
                <div className="mb-4 p-4 bg-gray-50 rounded border border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-800">World Bank API</h4>
                      <p className="text-sm text-gray-600">https://search.worldbank.org/api/v2/projects</p>
                    </div>
                    <button
                      onClick={testWorldBankAPI}
                      disabled={testing}
                      className="bg-[#009FDA] text-white px-4 py-2 rounded hover:bg-[#0088cc] transition disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                    >
                      {testing ? 'Testing...' : 'Test API'}
                    </button>
                  </div>
                  {apiTest && (
                    <div className={`mt-3 p-3 rounded text-sm ${
                      apiTest.status === 'success'
                        ? 'bg-green-50 border border-green-200 text-green-800'
                        : 'bg-red-50 border border-red-200 text-red-800'
                    }`}>
                      <div className="font-semibold mb-1">
                        {apiTest.status === 'success' ? '✓ API Available' : '✗ API Unavailable'}
                      </div>
                      <div>{apiTest.message}</div>
                      {apiTest.data && (
                        <div className="mt-2 text-xs font-mono bg-white bg-opacity-50 p-2 rounded">
                          <div>Total Projects: {apiTest.data.total || 0}</div>
                          <div>Response Time: {apiTest.data.responseTime || 'N/A'}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-700">AI Model API Keys</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded border border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">OpenAI API Key</label>
                        <input
                          type="password"
                          value={apiKeys.openai}
                          onChange={(e) => setApiKeys({ ...apiKeys, openai: e.target.value })}
                          placeholder="sk-..."
                          className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-[#009FDA] focus:border-transparent"
                        />
                      </div>
                      <button
                        onClick={() => testAiModel('openai')}
                        disabled={testingAi || !apiKeys.openai}
                        className="ml-2 mt-6 bg-[#009FDA] text-white px-3 py-2 rounded hover:bg-[#0088cc] transition disabled:bg-gray-300 disabled:cursor-not-allowed text-sm whitespace-nowrap"
                      >
                        {testingAi ? 'Testing...' : 'Test'}
                      </button>
                    </div>
                    {aiTest && aiTest.provider === 'openai' && (
                      <div className={`mt-2 p-2 rounded text-xs ${
                        aiTest.status === 'success'
                          ? 'bg-green-50 border border-green-200 text-green-800'
                          : 'bg-red-50 border border-red-200 text-red-800'
                      }`}>
                        {aiTest.message}
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-gray-50 rounded border border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Anthropic API Key</label>
                        <input
                          type="password"
                          value={apiKeys.anthropic}
                          onChange={(e) => setApiKeys({ ...apiKeys, anthropic: e.target.value })}
                          placeholder="sk-ant-..."
                          className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-[#009FDA] focus:border-transparent"
                        />
                      </div>
                      <button
                        onClick={() => testAiModel('anthropic')}
                        disabled={testingAi || !apiKeys.anthropic}
                        className="ml-2 mt-6 bg-[#009FDA] text-white px-3 py-2 rounded hover:bg-[#0088cc] transition disabled:bg-gray-300 disabled:cursor-not-allowed text-sm whitespace-nowrap"
                      >
                        {testingAi ? 'Testing...' : 'Test'}
                      </button>
                    </div>
                    {aiTest && aiTest.provider === 'anthropic' && (
                      <div className={`mt-2 p-2 rounded text-xs ${
                        aiTest.status === 'success'
                          ? 'bg-green-50 border border-green-200 text-green-800'
                          : 'bg-red-50 border border-red-200 text-red-800'
                      }`}>
                        {aiTest.message}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 p-4 bg-blue-50 rounded border border-blue-200">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Web Search Test</label>
                        <p className="text-xs text-gray-600 mb-2">
                          Test if OpenAI's gpt-4o-search-preview can access real-time web data
                        </p>
                      </div>
                      <button
                        onClick={testWebSearch}
                        disabled={testingWebSearch || !apiKeys.openai}
                        className="ml-2 bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed text-sm whitespace-nowrap"
                      >
                        {testingWebSearch ? 'Searching...' : 'Test Web Search'}
                      </button>
                    </div>
                    {webSearchTest && (
                      <div className={`mt-2 p-3 rounded text-xs ${
                        webSearchTest.status === 'success'
                          ? 'bg-green-50 border border-green-200 text-green-800'
                          : webSearchTest.status === 'warning'
                          ? 'bg-yellow-50 border border-yellow-200 text-yellow-800'
                          : 'bg-red-50 border border-red-200 text-red-800'
                      }`}>
                        <div className="font-semibold mb-1">{webSearchTest.message}</div>
                        {webSearchTest.searchResults && (
                          <div className="mt-2 text-xs bg-white bg-opacity-50 p-2 rounded max-h-32 overflow-y-auto">
                            {webSearchTest.searchResults}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-700">Model Selection</h3>
                <select
                  value={activeModel}
                  onChange={(e) => setActiveModel(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-[#009FDA] focus:border-transparent mb-2"
                >
                  <option value="demo">Demo Mode (no key needed)</option>
                  <optgroup label="OpenAI Models">
                    <option value="gpt-4o">GPT-4o</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  </optgroup>
                  <optgroup label="Anthropic Models">
                    <option value="claude-sonnet-4-20250514">Claude Sonnet 4</option>
                    <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                    <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
                  </optgroup>
                  {customModels.length > 0 && (
                    <optgroup label="Custom Models">
                      {customModels.map(model => (
                        <option key={model} value={model}>{model}</option>
                      ))}
                    </optgroup>
                  )}
                </select>

                <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Add Custom Model</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customModel}
                      onChange={(e) => setCustomModel(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addCustomModel()}
                      placeholder="e.g., gpt-4o-mini, claude-opus-4"
                      className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#009FDA] focus:border-transparent"
                    />
                    <button
                      onClick={addCustomModel}
                      disabled={!customModel.trim()}
                      className="bg-[#009FDA] text-white px-4 py-2 rounded hover:bg-[#0088cc] transition disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                    >
                      Add
                    </button>
                  </div>
                  {customModels.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {customModels.map(model => (
                        <span key={model} className="inline-flex items-center bg-white border border-gray-300 rounded px-2 py-1 text-xs">
                          {model}
                          <button
                            onClick={() => removeCustomModel(model)}
                            className="ml-2 text-red-600 hover:text-red-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-700">Scoring Prompt</h3>
                <textarea
                  value={scoringPrompt}
                  onChange={(e) => setScoringPrompt(e.target.value)}
                  rows={10}
                  className="w-full border border-gray-300 rounded px-3 py-2 font-mono text-sm focus:ring-2 focus:ring-[#009FDA] focus:border-transparent"
                />
                <button
                  onClick={() => setScoringPrompt(DEFAULT_SCORING_PROMPT)}
                  className="mt-2 text-sm text-[#009FDA] hover:underline"
                >
                  Reset to Default
                </button>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-700">Report Prompt</h3>
                <textarea
                  value={reportPrompt}
                  onChange={(e) => setReportPrompt(e.target.value)}
                  rows={8}
                  className="w-full border border-gray-300 rounded px-3 py-2 font-mono text-sm focus:ring-2 focus:ring-[#009FDA] focus:border-transparent"
                />
                <button
                  onClick={() => setReportPrompt(DEFAULT_REPORT_PROMPT)}
                  className="mt-2 text-sm text-[#009FDA] hover:underline"
                >
                  Reset to Default
                </button>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex gap-3">
              <button
                onClick={saveSettings}
                disabled={saving}
                className="flex-1 bg-[#28A745] text-white px-4 py-2 rounded hover:bg-green-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
              <button
                onClick={() => setSettingsOpen(false)}
                className="flex-1 bg-[#002244] text-white px-4 py-2 rounded hover:bg-[#003366] transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {reportOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Innovation Opportunity Report</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={downloadReport}
                  className="flex items-center gap-2 px-4 py-2 bg-[#009FDA] text-white rounded-lg hover:bg-[#0088cc] transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download HTML
                </button>
                <button
                  onClick={printReport}
                  className="flex items-center gap-2 px-4 py-2 bg-[#002244] text-white rounded-lg hover:bg-[#003366] transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print / Save PDF
                </button>
                <button
                  onClick={() => setReportOpen(false)}
                  className="p-2 text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              <iframe
                srcDoc={report}
                className="w-full h-full border-0"
                title="Report Preview"
              />
            </div>
          </div>
        </div>
      )}

      {viewingResearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-800">Web Research Data: {viewingResearch.projectName}</h2>
              <button
                onClick={() => setViewingResearch(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {Object.entries(viewingResearch.results).map(([category, results]: [string, any]) => (
                <div key={category} className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">{category}</h3>
                  <div className="space-y-3">
                    {Array.isArray(results) && results.length > 0 ? (
                      results.map((result: any, index: number) => (
                        <div key={index} className="bg-white p-3 rounded border border-gray-200">
                          <div className="font-semibold text-gray-900 mb-1">{index + 1}. {result.title}</div>
                          <div className="text-sm text-gray-600 mb-2">{result.description}</div>
                          <a
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 underline break-all"
                          >
                            {result.url}
                          </a>
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-500 italic">No results found for this category</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t bg-gray-50 sticky bottom-0">
              <button
                onClick={() => setViewingResearch(null)}
                className="w-full bg-[#002244] text-white px-4 py-2 rounded hover:bg-[#003366] transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
