import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { projects, generatedDate } = await req.json();

    const sortedProjects = [...projects].sort((a: any, b: any) =>
      (b.score?.overall_score || 0) - (a.score?.overall_score || 0)
    );

    const html = generateReportHTML(sortedProjects, generatedDate || new Date().toISOString());

    return new Response(
      JSON.stringify({ html }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Report generation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateReportHTML(projects: any[], generatedDate: string): string {
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatAmount = (amt: string) => {
    const num = parseInt((amt || '0').replace(/,/g, ''), 10);
    if (num >= 1000000000) return `$${(num / 1000000000).toFixed(1)}B`;
    if (num >= 1000000) return `$${(num / 1000000).toFixed(0)}M`;
    return 'TBD';
  };

  const getScoreColor = (score: number) => {
    if (score >= 7) return '#059669';
    if (score >= 5) return '#D97706';
    return '#6B7280';
  };

  const getDimensionIcon = (dimension: string) => {
    const icons: Record<string, string> = {
      'emerging_tech': '⚡',
      'foresight': '🔮',
      'collective_intelligence': '🤝'
    };
    return icons[dimension] || '📊';
  };

  const getPrimaryDimension = (score: any) => {
    if (!score) return { key: 'unknown', label: 'Not Scored' };
    const tech = score.emerging_tech?.score || 0;
    const foresight = score.foresight?.score || 0;
    const collective = score.collective_intelligence?.score || 0;

    if (tech >= foresight && tech >= collective) return { key: 'emerging_tech', label: 'Emerging Technology' };
    if (foresight >= collective) return { key: 'foresight', label: 'Strategic Foresight' };
    return { key: 'collective_intelligence', label: 'Collective Intelligence' };
  };

  const totalFinancing = projects.reduce((sum: number, p: any) =>
    sum + parseInt((p.totalamt || '0').replace(/,/g, ''), 10), 0
  );

  const highPriorityCount = projects.filter((p: any) => (p.score?.overall_score || 0) >= 7).length;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Innovation Opportunity Report - World Bank ITS Innovation Labs</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@300;400;600;700&family=Source+Serif+Pro:wght@400;600&display=swap');
    
    :root {
      --wb-dark-blue: #002244;
      --wb-light-blue: #009FDA;
      --wb-accent: #00A9E0;
      --text-primary: #1F2937;
      --text-secondary: #6B7280;
      --border-color: #E5E7EB;
      --bg-light: #F9FAFB;
      --green: #059669;
      --amber: #D97706;
      --purple: #7C3AED;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Source Sans Pro', -apple-system, BlinkMacSystemFont, sans-serif;
      color: var(--text-primary);
      line-height: 1.6;
      background: white;
    }
    
    .report-container {
      max-width: 850px;
      margin: 0 auto;
      padding: 0;
    }
    
    .cover-page {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background: linear-gradient(135deg, var(--wb-dark-blue) 0%, #003366 100%);
      color: white;
      text-align: center;
      padding: 60px 40px;
      page-break-after: always;
    }
    
    .cover-logo {
      font-size: 14px;
      letter-spacing: 3px;
      text-transform: uppercase;
      opacity: 0.8;
      margin-bottom: 40px;
    }
    
    .cover-title {
      font-family: 'Source Serif Pro', Georgia, serif;
      font-size: 42px;
      font-weight: 600;
      line-height: 1.2;
      margin-bottom: 20px;
    }
    
    .cover-subtitle {
      font-size: 20px;
      font-weight: 300;
      opacity: 0.9;
      margin-bottom: 60px;
    }
    
    .cover-meta {
      font-size: 14px;
      opacity: 0.7;
    }
    
    .cover-stats {
      display: flex;
      gap: 60px;
      margin-top: 60px;
    }
    
    .cover-stat {
      text-align: center;
    }
    
    .cover-stat-value {
      font-size: 48px;
      font-weight: 700;
      color: var(--wb-light-blue);
    }
    
    .cover-stat-label {
      font-size: 14px;
      opacity: 0.8;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .methodology-page {
      padding: 60px 50px;
      page-break-after: always;
    }
    
    .section-header {
      border-bottom: 3px solid var(--wb-dark-blue);
      padding-bottom: 15px;
      margin-bottom: 30px;
    }
    
    .section-title {
      font-family: 'Source Serif Pro', Georgia, serif;
      font-size: 28px;
      color: var(--wb-dark-blue);
    }
    
    .methodology-intro {
      font-size: 17px;
      color: var(--text-secondary);
      margin-bottom: 40px;
      line-height: 1.8;
    }
    
    .dimension-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 30px;
    }
    
    .dimension-card {
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 25px;
      background: var(--bg-light);
    }
    
    .dimension-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 15px;
    }
    
    .dimension-icon {
      font-size: 24px;
    }
    
    .dimension-name {
      font-size: 18px;
      font-weight: 600;
      color: var(--wb-dark-blue);
    }
    
    .dimension-weight {
      margin-left: auto;
      font-size: 14px;
      color: var(--text-secondary);
      background: white;
      padding: 4px 12px;
      border-radius: 20px;
    }
    
    .dimension-description {
      font-size: 15px;
      color: var(--text-secondary);
      margin-bottom: 15px;
    }
    
    .dimension-signals {
      font-size: 14px;
    }
    
    .dimension-signals strong {
      color: var(--text-primary);
    }
    
    .formula-box {
      background: var(--wb-dark-blue);
      color: white;
      padding: 25px 30px;
      border-radius: 8px;
      margin-top: 40px;
    }
    
    .formula-title {
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
      opacity: 0.8;
      margin-bottom: 15px;
    }
    
    .formula-content {
      font-family: 'SF Mono', 'Consolas', monospace;
      font-size: 15px;
      line-height: 2;
    }
    
    .project-page {
      padding: 50px;
      page-break-after: always;
      min-height: 100vh;
    }
    
    .project-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
      padding-bottom: 25px;
      border-bottom: 1px solid var(--border-color);
    }
    
    .project-rank {
      font-size: 14px;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }
    
    .project-name {
      font-family: 'Source Serif Pro', Georgia, serif;
      font-size: 26px;
      color: var(--wb-dark-blue);
      line-height: 1.3;
      max-width: 500px;
    }
    
    .project-meta {
      display: flex;
      gap: 20px;
      margin-top: 12px;
      font-size: 14px;
      color: var(--text-secondary);
    }
    
    .project-meta-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    
    .score-display {
      text-align: center;
    }
    
    .score-circle {
      width: 90px;
      height: 90px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    
    .score-label {
      font-size: 12px;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .primary-dimension-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      margin-top: 10px;
    }
    
    .dimension-tech { background: #FEF3C7; color: #92400E; }
    .dimension-foresight { background: #EDE9FE; color: #5B21B6; }
    .dimension-collective { background: #D1FAE5; color: #065F46; }
    
    .score-breakdown {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 35px;
    }
    
    .breakdown-item {
      background: var(--bg-light);
      border-radius: 8px;
      padding: 20px;
    }
    
    .breakdown-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    
    .breakdown-label {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .breakdown-score {
      font-size: 24px;
      font-weight: 700;
    }
    
    .breakdown-bar {
      height: 6px;
      background: #E5E7EB;
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 12px;
    }
    
    .breakdown-bar-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.3s ease;
    }
    
    .breakdown-evidence {
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.5;
    }
    
    .justification-section {
      margin-bottom: 30px;
    }
    
    .justification-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--wb-dark-blue);
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .findings-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
    }
    
    .finding-card {
      background: white;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      padding: 15px;
    }
    
    .finding-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-secondary);
      margin-bottom: 6px;
    }
    
    .finding-items {
      font-size: 14px;
      color: var(--text-primary);
    }
    
    .finding-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      margin-bottom: 4px;
    }
    
    .finding-bullet {
      color: var(--wb-light-blue);
      font-weight: bold;
    }
    
    .opportunities-section {
      background: linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%);
      border-radius: 8px;
      padding: 25px;
      margin-bottom: 25px;
    }
    
    .opportunities-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--wb-dark-blue);
      margin-bottom: 15px;
    }
    
    .opportunity-item {
      display: flex;
      align-items: flex-start;
      gap: 15px;
      padding: 12px 0;
      border-bottom: 1px solid rgba(0, 34, 68, 0.1);
    }
    
    .opportunity-item:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    
    .opportunity-number {
      width: 28px;
      height: 28px;
      background: var(--wb-dark-blue);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 600;
      flex-shrink: 0;
    }
    
    .opportunity-content {
      flex: 1;
    }
    
    .opportunity-text {
      font-size: 15px;
      color: var(--text-primary);
      margin-bottom: 4px;
    }
    
    .opportunity-approach {
      font-size: 13px;
      color: var(--text-secondary);
    }
    
    .opportunity-approach strong {
      color: var(--wb-dark-blue);
    }
    
    .key-insight {
      border-left: 4px solid var(--wb-light-blue);
      padding: 15px 20px;
      background: #F8FAFC;
      font-size: 15px;
      color: var(--text-primary);
      font-style: italic;
    }
    
    .summary-page {
      padding: 50px;
      page-break-after: always;
    }
    
    .summary-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 25px;
    }
    
    .summary-table th {
      background: var(--wb-dark-blue);
      color: white;
      padding: 14px 16px;
      text-align: left;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .summary-table th:first-child {
      border-radius: 6px 0 0 0;
    }
    
    .summary-table th:last-child {
      border-radius: 0 6px 0 0;
      text-align: center;
    }
    
    .summary-table td {
      padding: 14px 16px;
      border-bottom: 1px solid var(--border-color);
      font-size: 14px;
    }
    
    .summary-table tr:hover {
      background: var(--bg-light);
    }
    
    .summary-table .rank-cell {
      font-weight: 600;
      color: var(--text-secondary);
      width: 50px;
    }
    
    .summary-table .score-cell {
      text-align: center;
    }
    
    .summary-score {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      color: white;
      font-weight: 700;
      font-size: 14px;
    }
    
    .summary-dimension {
      font-size: 12px;
      color: var(--text-secondary);
    }
    
    .page-footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: var(--text-secondary);
    }
    
    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
      
      .cover-page,
      .methodology-page,
      .project-page,
      .summary-page {
        page-break-after: always;
      }
      
      .project-page:last-of-type {
        page-break-after: auto;
      }
    }
  </style>
</head>
<body>
  <div class="report-container">
    <div class="cover-page">
      <div class="cover-logo">World Bank Group · ITS Innovation Labs</div>
      <h1 class="cover-title">Innovation Opportunity<br>Assessment Report</h1>
      <p class="cover-subtitle">Strategic Analysis of World Bank Projects for<br>Technology and Innovation Engagement</p>
      <div class="cover-stats">
        <div class="cover-stat">
          <div class="cover-stat-value">${projects.length}</div>
          <div class="cover-stat-label">Projects Analyzed</div>
        </div>
        <div class="cover-stat">
          <div class="cover-stat-value">${highPriorityCount}</div>
          <div class="cover-stat-label">High Priority</div>
        </div>
        <div class="cover-stat">
          <div class="cover-stat-value">${formatAmount(totalFinancing.toString())}</div>
          <div class="cover-stat-label">Total Financing</div>
        </div>
      </div>
      <p class="cover-meta">Generated ${formatDate(generatedDate)}</p>
    </div>
    
    <div class="methodology-page">
      <div class="section-header">
        <h2 class="section-title">Scoring Methodology</h2>
      </div>
      
      <p class="methodology-intro">
        Each project is evaluated across three dimensions that reflect the ITS Innovation Lab's core value propositions. 
        Scores are derived from web research on innovation activity in the project's domain, ensuring assessments 
        are grounded in current technology trends rather than static assumptions.
      </p>
      
      <div class="dimension-grid">
        <div class="dimension-card">
          <div class="dimension-header">
            <span class="dimension-icon">🔮</span>
            <span class="dimension-name">Strategic Foresight</span>
            <span class="dimension-weight">35% weight</span>
          </div>
          <p class="dimension-description">
            Measures the project's need for future-proofing and anticipatory planning. High scores indicate 
            domains facing significant disruption where investments risk obsolescence without foresight integration.
          </p>
          <p class="dimension-signals">
            <strong>Key signals:</strong> Long implementation horizons, infrastructure lock-in risk, 
            policy/strategy components, high sector disruption velocity
          </p>
        </div>
        
        <div class="dimension-card">
          <div class="dimension-header">
            <span class="dimension-icon">⚡</span>
            <span class="dimension-name">Emerging Technology</span>
            <span class="dimension-weight">35% weight</span>
          </div>
          <p class="dimension-description">
            Evaluates the richness of applicable frontier technologies including AI/ML, Blockchain, 
            IoT/Digital Twins, Drones, and Digital Public Infrastructure.
          </p>
          <p class="dimension-signals">
            <strong>Key signals:</strong> Proven technology applications in domain, maturity of solutions, 
            relevance to project challenges, implementation precedents
          </p>
        </div>
        
        <div class="dimension-card">
          <div class="dimension-header">
            <span class="dimension-icon">🤝</span>
            <span class="dimension-name">Collective Intelligence</span>
            <span class="dimension-weight">30% weight</span>
          </div>
          <p class="dimension-description">
            Assesses potential for innovation challenges, hackathons, bootcamps, and ecosystem engagement 
            approaches that leverage diverse stakeholders for solution development.
          </p>
          <p class="dimension-signals">
            <strong>Key signals:</strong> Startup ecosystem activity, precedent innovation challenges, 
            multi-stakeholder complexity, capacity building components
          </p>
        </div>
      </div>
      
      <div class="formula-box">
        <div class="formula-title">Score Calculation</div>
        <div class="formula-content">
          Base Score = (Tech × 0.35) + (Foresight × 0.35) + (Collective × 0.30)<br>
          Relevance Modifier = 0.7 + (Relevance Score × 0.06)<br>
          Scale Modifier = 1.0 to 1.15 based on project financing amount<br>
          <strong>Final Score = Base × Relevance × Scale (max 10)</strong>
        </div>
      </div>
    </div>
    
    <div class="summary-page">
      <div class="section-header">
        <h2 class="section-title">Executive Summary</h2>
      </div>
      
      <table class="summary-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Project</th>
            <th>Country</th>
            <th>Amount</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          ${projects.map((p: any, i: number) => {
            const country = Array.isArray(p.countryname) ? p.countryname[0] : p.countryname || 'N/A';
            const score = p.score?.overall_score || 0;
            const primary = getPrimaryDimension(p.score);
            return `
          <tr>
            <td class="rank-cell">#${i + 1}</td>
            <td>
              <strong>${p.project_name}</strong><br>
              <span style="color: var(--text-secondary); font-size: 12px;">${p.id}</span>
            </td>
            <td>${country}</td>
            <td>${formatAmount(p.totalamt)}</td>
            <td class="score-cell">
              <span class="summary-score" style="background: ${getScoreColor(score)}">${score}</span>
              <div class="summary-dimension">${getDimensionIcon(primary.key)} ${primary.label}</div>
            </td>
          </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
    
    ${projects.map((p: any, i: number) => {
      const country = Array.isArray(p.countryname) ? p.countryname[0] : p.countryname || 'N/A';
      const score = p.score || {};
      const overall = score.overall_score || 0;
      const primary = getPrimaryDimension(score);
      const techScore = score.emerging_tech?.score || 0;
      const foresightScore = score.foresight?.score || 0;
      const collectiveScore = score.collective_intelligence?.score || 0;
      
      const dimClass = primary.key === 'emerging_tech' ? 'tech' : primary.key === 'foresight' ? 'foresight' : 'collective';
      
      return `
    <div class="project-page">
      <div class="project-header">
        <div>
          <div class="project-rank">Project #${i + 1} of ${projects.length}</div>
          <h2 class="project-name">${p.project_name}</h2>
          <div class="project-meta">
            <span class="project-meta-item">
              <span>📍</span> ${country}
            </span>
            <span class="project-meta-item">
              <span>💰</span> ${formatAmount(p.totalamt)}
            </span>
            <span class="project-meta-item">
              <span>🏷️</span> ${p.id}
            </span>
          </div>
        </div>
        <div class="score-display">
          <div class="score-circle" style="background: ${getScoreColor(overall)}">${overall}</div>
          <div class="score-label">Overall Score</div>
          <div class="primary-dimension-badge dimension-${dimClass}">
            ${getDimensionIcon(primary.key)} ${primary.label}
          </div>
        </div>
      </div>
      
      <div class="score-breakdown">
        <div class="breakdown-item">
          <div class="breakdown-header">
            <span class="breakdown-label">🔮 Foresight</span>
            <span class="breakdown-score" style="color: ${getScoreColor(foresightScore)}">${foresightScore}</span>
          </div>
          <div class="breakdown-bar">
            <div class="breakdown-bar-fill" style="width: ${foresightScore * 10}%; background: ${getScoreColor(foresightScore)}"></div>
          </div>
          <div class="breakdown-evidence">${score.foresight?.evidence || 'Analysis pending'}</div>
        </div>
        
        <div class="breakdown-item">
          <div class="breakdown-header">
            <span class="breakdown-label">⚡ Technology</span>
            <span class="breakdown-score" style="color: ${getScoreColor(techScore)}">${techScore}</span>
          </div>
          <div class="breakdown-bar">
            <div class="breakdown-bar-fill" style="width: ${techScore * 10}%; background: ${getScoreColor(techScore)}"></div>
          </div>
          <div class="breakdown-evidence">${score.emerging_tech?.evidence || 'Analysis pending'}</div>
        </div>
        
        <div class="breakdown-item">
          <div class="breakdown-header">
            <span class="breakdown-label">🤝 Collective</span>
            <span class="breakdown-score" style="color: ${getScoreColor(collectiveScore)}">${collectiveScore}</span>
          </div>
          <div class="breakdown-bar">
            <div class="breakdown-bar-fill" style="width: ${collectiveScore * 10}%; background: ${getScoreColor(collectiveScore)}"></div>
          </div>
          <div class="breakdown-evidence">${score.collective_intelligence?.evidence || 'Analysis pending'}</div>
        </div>
      </div>
      
      <div class="justification-section">
        <div class="justification-title">📋 Research Findings</div>
        <div class="findings-grid">
          <div class="finding-card">
            <div class="finding-label">Technologies Identified</div>
            <div class="finding-items">
              ${(score.emerging_tech?.technologies || ['No specific technologies identified']).map((t: string) => 
                `<div class="finding-item"><span class="finding-bullet">→</span> ${t}</div>`
              ).join('')}
            </div>
          </div>
          <div class="finding-card">
            <div class="finding-label">Anticipated Disruptions</div>
            <div class="finding-items">
              ${(score.foresight?.disruptions || ['No specific disruptions identified']).map((d: string) => 
                `<div class="finding-item"><span class="finding-bullet">→</span> ${d}</div>`
              ).join('')}
            </div>
          </div>
          <div class="finding-card">
            <div class="finding-label">Ecosystem Activity</div>
            <div class="finding-items">
              ${(score.collective_intelligence?.examples || ['No specific examples found']).map((e: string) => 
                `<div class="finding-item"><span class="finding-bullet">→</span> ${e}</div>`
              ).join('')}
            </div>
          </div>
          <div class="finding-card">
            <div class="finding-label">Relevance Assessment</div>
            <div class="finding-items">
              ${score.relevance?.rationale || 'Relevance assessment pending'}
            </div>
          </div>
        </div>
      </div>
      
      ${score.top_opportunities && score.top_opportunities.length > 0 ? `
      <div class="opportunities-section">
        <div class="opportunities-title">🎯 Recommended Engagement Opportunities</div>
        ${score.top_opportunities.map((opp: any, j: number) => {
          const dimLabel = opp.dimension === 'emerging_tech' ? 'Technology' : opp.dimension === 'foresight' ? 'Foresight' : 'Collective Intelligence';
          return `
        <div class="opportunity-item">
          <div class="opportunity-number">${j + 1}</div>
          <div class="opportunity-content">
            <div class="opportunity-text">${opp.opportunity}</div>
            <div class="opportunity-approach">
              <strong>Approach:</strong> ${opp.approach} · 
              <strong>Dimension:</strong> ${dimLabel}
            </div>
          </div>
        </div>
        `;
        }).join('')}
      </div>
      ` : ''}
      
      ${score.key_insight ? `
      <div class="key-insight">
        <strong>Key Insight:</strong> ${score.key_insight}
      </div>
      ` : ''}
      
      <div class="page-footer">
        <span>World Bank ITS Innovation Labs</span>
        <span>Page ${i + 3} of ${projects.length + 3}</span>
      </div>
    </div>
    `;
    }).join('')}
    
  </div>
</body>
</html>`;
}
