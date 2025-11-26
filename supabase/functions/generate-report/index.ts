import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function generateDemoReport(projects: any[]) {
  const sorted = projects.sort((a, b) => b.score.overall_score - a.score.overall_score);
  const top5 = sorted.slice(0, 5);
  
  let report = `# World Bank Innovation Lab\n# Strategic Opportunity Briefing\n\n`;
  report += `## EXECUTIVE SUMMARY\n\n`;
  report += `Analyzed ${projects.length} World Bank projects using research-driven scoring across three dimensions: Strategic Foresight, Emerging Technologies, and Collective Intelligence. `;
  report += `The portfolio shows strong innovation potential, particularly in digital transformation and climate resilience. `;
  report += `Top recommendation: Engage with highest-scoring projects through targeted technology partnerships and foresight planning workshops.\n\n`;
  
  report += `## TOP 5 OPPORTUNITIES\n\n`;
  top5.forEach((p, i) => {
    const primary = p.score.primary_dimension || 'emerging_tech';
    const icon = primary === 'emerging_tech' ? '⚡' : primary === 'foresight' ? '🔮' : '🤝';
    report += `### ${i + 1}. ${p.project_name} (${Array.isArray(p.countryname) ? p.countryname[0] : p.countryname})\n\n`;
    report += `**Score: ${p.score.overall_score}/10** ${icon} Primary: ${primary.replace('_', ' ')}\n\n`;
    report += `**Key Opportunity:** ${p.score.key_insight || p.score.top_opportunities?.[0]?.opportunity || 'Strong innovation potential identified'}\n\n`;
    report += `**Recommended Approach:** ${p.score.top_opportunities?.[0]?.approach || 'Technology partnership and strategic advisory'}\n\n`;
  });
  
  report += `## THEMATIC PATTERNS\n\n`;
  const techSet = new Set();
  const regionSet = new Set();
  projects.forEach(p => {
    p.score.emerging_tech?.technologies?.forEach((t: string) => techSet.add(t));
    regionSet.add(p.regionname);
  });
  
  report += `**Technology Themes:** ${Array.from(techSet).slice(0, 5).join(', ')}\n\n`;
  report += `**Regional Distribution:** ${Array.from(regionSet).join(', ')}\n\n`;
  report += `**Foresight Concerns:** Climate adaptation, digital transformation, and sustainable development emerge as key priorities across multiple projects.\n\n`;
  
  report += `## RECOMMENDED NEXT STEPS\n\n`;
  report += `1. **Initiate Engagement:** Contact project teams for top 3 opportunities to explore Lab collaboration\n`;
  report += `2. **Technology Assessment:** Conduct deep-dive analysis on emerging technologies identified across portfolio\n`;
  report += `3. **Regional Strategy:** Develop region-specific engagement approaches based on innovation patterns\n`;
  
  return report;
}

async function generateWithAI(projects: any[], prompt: string, model: string, apiKey: string) {
  const projectsJson = JSON.stringify(projects.map(p => ({
    name: p.project_name,
    country: p.countryname,
    score: p.score
  })));
  
  const fullPrompt = prompt.replace('{{projects_json}}', projectsJson);
  
  if (model.startsWith('gpt')) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: fullPrompt }],
        temperature: 0.7,
        max_tokens: 2000
      })
    });
    
    if (!response.ok) throw new Error('OpenAI API failed');
    const data = await response.json();
    return data.choices[0].message.content;
  } else {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: 2000,
        messages: [{ role: 'user', content: fullPrompt }]
      })
    });
    
    if (!response.ok) throw new Error('Anthropic API failed');
    const data = await response.json();
    return data.content[0].text;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { projects, prompt, model, apiKey } = await req.json();
    
    let report;
    if (model === 'demo' || !apiKey) {
      report = generateDemoReport(projects);
    } else {
      report = await generateWithAI(projects, prompt, model, apiKey);
    }
    
    return new Response(
      JSON.stringify({ report }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});