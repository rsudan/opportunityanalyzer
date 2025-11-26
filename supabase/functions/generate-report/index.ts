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

  const getConfidenceBadge = (confidence: string) => {
    const badges: Record<string, string> = {
      'high': '<span style="background: #D1FAE5; color: #065F46; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">High Confidence</span>',
      'medium': '<span style="background: #FEF3C7; color: #92400E; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">Medium Confidence</span>',
      'low': '<span style="background: #F3F4F6; color: #6B7280; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">Low Confidence</span>'
    };
    return badges[confidence] || badges['medium'];
  };

  const getResearchQualityBadge = (quality: string) => {
    const badges: Record<string, string> = {
      'high': '<span style="background: #DBEAFE; color: #1E40AF; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">Rich Research</span>',
      'medium': '<span style="background: #FEF3C7; color: #92400E; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">Moderate Research</span>',
      'low': '<span style="background: #F3F4F6; color: #6B7280; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">Limited Research</span>'
    };
    return badges[quality] || badges['medium'];
  };

  const totalFinancing = projects.reduce((sum: number, p: any) =>
    sum + parseInt((p.totalamt || '0').replace(/,/g, ''), 10), 0
  );

  const highPriorityCount = projects.filter((p: any) => (p.score?.overall_score || 0) >= 7).length;

  const projectPages = projects.map((p: any, i: number) => {
    const country = Array.isArray(p.countryname) ? p.countryname[0] : p.countryname || 'N/A';
    const score = p.score || {};
    const overall = score.overall_score || 0;
    const techScore = score.emerging_tech?.score || 0;
    const foresightScore = score.foresight?.score || 0;
    const collectiveScore = score.collective_intelligence?.score || 0;

    let infoSection = '';
    if (score.confidence_level || score.research_quality) {
      let rows = '';
      if (score.research_quality) {
        rows += `<div class="info-row"><span class="info-label">Research Quality:</span>${getResearchQualityBadge(score.research_quality)}</div>`;
      }
      if (score.confidence_level) {
        rows += `<div class="info-row"><span class="info-label">Confidence Level:</span>${getConfidenceBadge(score.confidence_level)}</div>`;
      }
      if (score.relevance?.country_context) {
        rows += `<div class="info-row"><span class="info-label">Country Context:</span><span style="font-size:13px">${score.relevance.country_context}</span></div>`;
      }
      infoSection = `<div class="info-section">${rows}</div>`;
    }

    let techContent = '';
    if (score.emerging_tech?.evidence) {
      techContent += `<div class="evidence-text">${score.emerging_tech.evidence}</div>`;
    }
    if (score.emerging_tech?.technologies?.length > 0) {
      const techList = score.emerging_tech.technologies.map((t: string) =>
        `<div class="finding-item"><span class="finding-bullet">→</span> ${t}</div>`
      ).join('');
      techContent += `<div style="margin-bottom:12px"><strong style="font-size:13px;color:var(--text-secondary)">Technologies Identified:</strong><div class="findings-list">${techList}</div></div>`;
    }
    if (score.emerging_tech?.key_players?.length > 0) {
      const playersList = score.emerging_tech.key_players.map((k: string) =>
        `<div class="finding-item"><span class="finding-bullet">→</span> ${k}</div>`
      ).join('');
      techContent += `<div><strong style="font-size:13px;color:var(--text-secondary)">Key Players:</strong><div class="findings-list">${playersList}</div></div>`;
    }

    let foresightContent = '';
    if (score.foresight?.evidence) {
      foresightContent += `<div class="evidence-text">${score.foresight.evidence}</div>`;
    }
    if (score.foresight?.disruptions?.length > 0) {
      const disruptionsList = score.foresight.disruptions.map((d: string) =>
        `<div class="finding-item"><span class="finding-bullet">→</span> ${d}</div>`
      ).join('');
      foresightContent += `<div style="margin-bottom:12px"><strong style="font-size:13px;color:var(--text-secondary)">Anticipated Disruptions:</strong><div class="findings-list">${disruptionsList}</div></div>`;
    }
    if (score.foresight?.strategic_risks?.length > 0) {
      const risksList = score.foresight.strategic_risks.map((r: string) =>
        `<div class="finding-item"><span class="finding-bullet">→</span> ${r}</div>`
      ).join('');
      foresightContent += `<div><strong style="font-size:13px;color:var(--text-secondary)">Strategic Risks:</strong><div class="findings-list">${risksList}</div></div>`;
    }
    if (score.foresight?.horizon) {
      foresightContent += `<div style="margin-top:10px;font-size:13px;color:var(--text-secondary)"><strong>Time Horizon:</strong> ${score.foresight.horizon}</div>`;
    }

    let collectiveContent = '';
    if (score.collective_intelligence?.evidence) {
      collectiveContent += `<div class="evidence-text">${score.collective_intelligence.evidence}</div>`;
    }
    if (score.collective_intelligence?.examples?.length > 0) {
      const examplesList = score.collective_intelligence.examples.map((e: string) =>
        `<div class="finding-item"><span class="finding-bullet">→</span> ${e}</div>`
      ).join('');
      collectiveContent += `<div style="margin-bottom:12px"><strong style="font-size:13px;color:var(--text-secondary)">Ecosystem Examples:</strong><div class="findings-list">${examplesList}</div></div>`;
    }
    if (score.collective_intelligence?.stakeholders?.length > 0) {
      const stakeholdersList = score.collective_intelligence.stakeholders.map((s: string) =>
        `<span class="stakeholder-tag">${s}</span>`
      ).join('');
      collectiveContent += `<div class="stakeholders-section"><div class="stakeholders-title">🎯 Identified Stakeholders</div><div class="stakeholder-list">${stakeholdersList}</div></div>`;
    }

    let opportunitiesSection = '';
    if (score.top_opportunities?.length > 0) {
      const oppCards = score.top_opportunities.map((opp: any, j: number) => {
        const dimLabel = opp.dimension === 'emerging_tech' ? 'Technology' : opp.dimension === 'foresight' ? 'Foresight' : 'Collective Intelligence';
        let rationale = '';
        if (opp.rationale) {
          rationale = `<div class="opportunity-rationale">${opp.rationale}</div>`;
        }
        let partners = '';
        if (opp.potential_partners?.length > 0) {
          const partnerTags = opp.potential_partners.map((partner: string) =>
            `<span class="partner-tag">${partner}</span>`
          ).join('');
          partners = `<div class="partners-list">${partnerTags}</div>`;
        }
        return `<div class="opportunity-card"><div class="opportunity-header"><div class="opportunity-number">${j+1}</div><div class="opportunity-text">${opp.opportunity}</div></div><div class="opportunity-meta"><span><strong>Approach:</strong> ${opp.approach}</span><span><strong>Dimension:</strong> ${dimLabel}</span></div>${rationale}${partners}</div>`;
      }).join('');
      opportunitiesSection = `<div class="opportunities-section"><div class="opportunities-title">🎯 Recommended Engagement Opportunities</div>${oppCards}</div>`;
    }

    let insightSection = '';
    if (score.key_insight) {
      insightSection = `<div class="key-insight"><strong>Key Insight:</strong> ${score.key_insight}</div>`;
    }

    return `
    <div class="project-page">
      <div class="project-header">
        <div><div class="project-rank">Project #${i+1} of ${projects.length}</div><h2 class="project-name">${p.project_name}</h2><div class="project-meta"><span>📍 ${country}</span><span>💰 ${formatAmount(p.totalamt)}</span><span>🏷️ ${p.id}</span></div></div>
        <div style="text-align:center"><div class="score-circle" style="background:${getScoreColor(overall)}">${overall}</div><div class="score-label">Overall Score</div></div>
      </div>
      ${infoSection}
      <div class="research-section">
        <div class="research-title">🔍 Research-Based Analysis</div>
        <div class="research-subsection">
          <div class="subsection-header"><span class="subsection-title">⚡ Emerging Technology</span><span class="subsection-score" style="color:${getScoreColor(techScore)}">${techScore}/10</span></div>
          ${techContent}
        </div>
        <div class="research-subsection">
          <div class="subsection-header"><span class="subsection-title">🔮 Strategic Foresight</span><span class="subsection-score" style="color:${getScoreColor(foresightScore)}">${foresightScore}/10</span></div>
          ${foresightContent}
        </div>
        <div class="research-subsection">
          <div class="subsection-header"><span class="subsection-title">🤝 Collective Intelligence</span><span class="subsection-score" style="color:${getScoreColor(collectiveScore)}">${collectiveScore}/10</span></div>
          ${collectiveContent}
        </div>
      </div>
      ${opportunitiesSection}
      ${insightSection}
      <div class="page-footer"><span>World Bank ITS Innovation Labs · Research-Driven Analysis</span><span>Page ${i+2} of ${projects.length+2}</span></div>
    </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Innovation Opportunity Report - World Bank ITS Innovation Labs</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@300;400;600;700&family=Source+Serif+Pro:wght@400;600&display=swap');
    :root{--wb-dark-blue:#002244;--wb-light-blue:#009FDA;--text-primary:#1F2937;--text-secondary:#6B7280;--border-color:#E5E7EB;--bg-light:#F9FAFB}*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Source Sans Pro',-apple-system,sans-serif;color:var(--text-primary);line-height:1.6}.report-container{max-width:900px;margin:0 auto}.cover-page{min-height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;background:linear-gradient(135deg,var(--wb-dark-blue) 0%,#003366 100%);color:white;text-align:center;padding:60px 40px;page-break-after:always}.cover-logo{font-size:14px;letter-spacing:3px;text-transform:uppercase;opacity:0.8;margin-bottom:40px}.cover-title{font-family:'Source Serif Pro',serif;font-size:42px;font-weight:600;line-height:1.2;margin-bottom:20px}.cover-subtitle{font-size:20px;font-weight:300;opacity:0.9;margin-bottom:60px}.cover-stats{display:flex;gap:60px;margin-top:60px}.cover-stat{text-align:center}.cover-stat-value{font-size:48px;font-weight:700;color:var(--wb-light-blue)}.cover-stat-label{font-size:14px;opacity:0.8;text-transform:uppercase;letter-spacing:1px}.methodology-page,.project-page{padding:50px;page-break-after:always}.section-header{border-bottom:3px solid var(--wb-dark-blue);padding-bottom:15px;margin-bottom:30px}.section-title{font-family:'Source Serif Pro',serif;font-size:28px;color:var(--wb-dark-blue)}.methodology-intro{font-size:17px;color:var(--text-secondary);margin-bottom:40px;line-height:1.8}.dimension-card{border:1px solid var(--border-color);border-radius:8px;padding:25px;background:var(--bg-light);margin-bottom:20px}.dimension-header{display:flex;align-items:center;gap:12px;margin-bottom:15px}.dimension-name{font-size:18px;font-weight:600;color:var(--wb-dark-blue)}.dimension-weight{margin-left:auto;font-size:14px;color:var(--text-secondary);background:white;padding:4px 12px;border-radius:20px}.dimension-description{font-size:15px;color:var(--text-secondary)}.project-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:30px;padding-bottom:25px;border-bottom:1px solid var(--border-color)}.project-rank{font-size:14px;color:var(--text-secondary);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px}.project-name{font-family:'Source Serif Pro',serif;font-size:26px;color:var(--wb-dark-blue);line-height:1.3;max-width:550px}.project-meta{display:flex;gap:20px;margin-top:12px;font-size:14px;color:var(--text-secondary);flex-wrap:wrap}.score-circle{width:90px;height:90px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:32px;font-weight:700;margin-bottom:8px}.score-label{font-size:12px;color:var(--text-secondary);text-transform:uppercase;letter-spacing:1px}.info-section{background:#F0F9FF;border-left:4px solid var(--wb-light-blue);padding:20px;margin-bottom:30px;border-radius:4px}.info-row{display:flex;gap:15px;margin-bottom:8px}.info-label{font-size:13px;font-weight:600;color:var(--text-secondary);min-width:140px}.research-section{margin-bottom:30px}.research-title{font-size:18px;font-weight:600;color:var(--wb-dark-blue);margin-bottom:20px}.research-subsection{margin-bottom:25px;padding:20px;background:white;border:1px solid var(--border-color);border-radius:8px}.subsection-header{display:flex;justify-content:space-between;margin-bottom:15px}.subsection-title{font-size:15px;font-weight:600;color:var(--wb-dark-blue)}.subsection-score{font-size:20px;font-weight:700}.evidence-text{font-size:14px;line-height:1.7;margin-bottom:15px;padding:15px;background:var(--bg-light);border-radius:6px;border-left:3px solid var(--wb-light-blue)}.findings-list{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}.finding-item{font-size:13px;padding:8px 12px;background:var(--bg-light);border-radius:4px;display:flex;gap:8px}.finding-bullet{color:var(--wb-light-blue);font-weight:bold}.stakeholders-section{background:#FEF3C7;border-left:4px solid#F59E0B;padding:20px;margin-bottom:25px;border-radius:4px}.stakeholders-title{font-size:15px;font-weight:600;color:#92400E;margin-bottom:12px}.stakeholder-list{display:flex;flex-wrap:wrap;gap:8px}.stakeholder-tag{background:white;color:#92400E;padding:6px 12px;border-radius:16px;font-size:13px;font-weight:500}.opportunities-section{background:linear-gradient(135deg,#F0F9FF 0%,#E0F2FE 100%);border-radius:8px;padding:25px;margin-bottom:25px}.opportunities-title{font-size:17px;font-weight:600;color:var(--wb-dark-blue);margin-bottom:18px}.opportunity-card{background:white;border:1px solid#BFDBFE;border-radius:8px;padding:18px;margin-bottom:15px}.opportunity-header{display:flex;gap:12px;margin-bottom:10px}.opportunity-number{width:28px;height:28px;background:var(--wb-dark-blue);color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:600}.opportunity-text{font-size:15px;font-weight:500;flex:1}.opportunity-meta{display:flex;gap:20px;font-size:13px;color:var(--text-secondary);padding-left:40px}.opportunity-rationale{font-size:13px;color:var(--text-secondary);line-height:1.6;padding-left:40px;margin-top:8px;font-style:italic}.partners-list{display:flex;flex-wrap:wrap;gap:6px;padding-left:40px;margin-top:8px}.partner-tag{background:#DBEAFE;color:#1E40AF;padding:4px 10px;border-radius:12px;font-size:12px;font-weight:500}.key-insight{border-left:4px solid var(--wb-light-blue);padding:18px 22px;background:#F8FAFC;font-size:15px;font-style:italic;line-height:1.8}.page-footer{margin-top:40px;padding-top:20px;border-top:1px solid var(--border-color);display:flex;justify-content:space-between;font-size:12px;color:var(--text-secondary)}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}.cover-page,.methodology-page,.project-page{page-break-after:always}.project-page:last-of-type{page-break-after:auto}}
  </style>
</head>
<body>
  <div class="report-container">
    <div class="cover-page">
      <div class="cover-logo">World Bank Group · ITS Innovation Labs</div>
      <h1 class="cover-title">Innovation Opportunity<br>Assessment Report</h1>
      <p class="cover-subtitle">Research-Driven Analysis of World Bank Projects for<br>Technology and Innovation Engagement</p>
      <div class="cover-stats">
        <div class="cover-stat"><div class="cover-stat-value">${projects.length}</div><div class="cover-stat-label">Projects Analyzed</div></div>
        <div class="cover-stat"><div class="cover-stat-value">${highPriorityCount}</div><div class="cover-stat-label">High Priority</div></div>
        <div class="cover-stat"><div class="cover-stat-value">${formatAmount(totalFinancing.toString())}</div><div class="cover-stat-label">Total Financing</div></div>
      </div>
      <p class="cover-meta" style="margin-top:20px;opacity:0.7">Generated ${formatDate(generatedDate)}</p>
    </div>
    <div class="methodology-page">
      <div class="section-header"><h2 class="section-title">Research Methodology</h2></div>
      <p class="methodology-intro">Each project undergoes comprehensive web research to identify innovation opportunities. The analysis conducts 5 targeted searches per project across emerging technologies, ecosystem activity, future trends, and real-world applications. Scores reflect actual findings from current sources rather than static assumptions, ensuring recommendations are grounded in verifiable evidence.</p>
      <div class="dimension-card"><div class="dimension-header"><span style="font-size:24px">⚡</span><span class="dimension-name">Emerging Technology Research</span><span class="dimension-weight">35% weight</span></div><p class="dimension-description">Identifies specific technologies (AI/ML, Blockchain, IoT, DPI) with proven applications in the project domain. Research surfaces named companies, products, and implementations with source verification.</p></div>
      <div class="dimension-card"><div class="dimension-header"><span style="font-size:24px">🔮</span><span class="dimension-name">Strategic Foresight Research</span><span class="dimension-weight">35% weight</span></div><p class="dimension-description">Analyzes disruption trends, future scenarios, and strategic risks facing the domain. Identifies specific shifts and timeframes from industry forecasts and expert analysis.</p></div>
      <div class="dimension-card"><div class="dimension-header"><span style="font-size:24px">🤝</span><span class="dimension-name">Ecosystem Intelligence Research</span><span class="dimension-weight">30% weight</span></div><p class="dimension-description">Maps innovation ecosystem activity including named challenges, hackathons, accelerators, and stakeholder networks. Identifies potential partners and collaboration opportunities.</p></div>
    </div>
    ${projectPages}
  </div>
</body>
</html>`;
}
