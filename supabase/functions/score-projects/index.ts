import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Project {
  id: string;
  project_name: string;
  countryname: string | string[];
  totalamt: string;
  sector1?: { Name: string };
}

function generateDemoScore(project: Project) {
  const name = project.project_name.toLowerCase();
  const country = Array.isArray(project.countryname) ? project.countryname[0] : project.countryname;
  const amount = parseInt((project.totalamt || '0').replace(/,/g, ''), 10);
  
  const techKeywords = ['digital', 'technology', 'innovation', 'ai', 'data', 'blockchain', 'iot', 'cloud', 'smart', 'cyber', 'internet', 'mobile', 'fintech', 'agtech'];
  const foresightKeywords = ['transformation', 'future', 'resilience', 'sustainability', 'climate', 'renewable', 'green', 'circular', 'adaptation'];
  const collectiveKeywords = ['ecosystem', 'partnership', 'collaborative', 'inclusive', 'participation', 'community', 'stakeholder'];
  
  const hasTech = techKeywords.some(k => name.includes(k));
  const hasForesight = foresightKeywords.some(k => name.includes(k));
  const hasCollective = collectiveKeywords.some(k => name.includes(k));
  
  const techScore = hasTech ? 7 + Math.random() * 2 : 4 + Math.random() * 2;
  const foresightScore = hasForesight ? 7 + Math.random() * 2 : 4 + Math.random() * 2;
  const collectiveScore = hasCollective ? 7 + Math.random() * 2 : 4 + Math.random() * 2;
  
  const overallScore = (techScore * 0.35 + foresightScore * 0.35 + collectiveScore * 0.30);
  
  const technologies = [];
  if (name.includes('digital')) technologies.push('Digital Public Infrastructure');
  if (name.includes('data')) technologies.push('Data analytics');
  if (name.includes('ai')) technologies.push('Artificial Intelligence');
  if (name.includes('blockchain')) technologies.push('Blockchain');
  if (name.includes('iot')) technologies.push('Internet of Things');
  if (name.includes('cloud')) technologies.push('Cloud computing');
  if (technologies.length === 0) technologies.push('Digital platforms');
  
  const disruptions = [];
  if (name.includes('transform')) disruptions.push('Digital transformation');
  if (name.includes('climate')) disruptions.push('Climate adaptation');
  if (name.includes('sustain')) disruptions.push('Sustainability transition');
  if (disruptions.length === 0) disruptions.push('Market evolution');
  
  const primaryDim = Math.max(techScore, foresightScore, collectiveScore);
  let primary = 'emerging_tech';
  if (primaryDim === foresightScore) primary = 'foresight';
  else if (primaryDim === collectiveScore) primary = 'collective_intelligence';
  
  return {
    projectId: project.id,
    success: true,
    emerging_tech: {
      score: Math.round(techScore * 10) / 10,
      technologies,
      applications: [`${technologies[0]} for ${project.project_name}`],
      evidence: 'Research indicates active technology innovation in this domain.'
    },
    foresight: {
      score: Math.round(foresightScore * 10) / 10,
      disruptions,
      horizon: foresightScore > 6.5 ? 'long-term' : 'medium-term',
      evidence: 'Domain facing significant disruption requiring forward planning.'
    },
    collective_intelligence: {
      score: Math.round(collectiveScore * 10) / 10,
      ecosystem_activity: collectiveScore > 6.5 ? 'high' : 'moderate',
      examples: ['Innovation challenges', 'Public consultations'],
      evidence: 'Ecosystem engagement opportunities identified in research.'
    },
    relevance: {
      score: Math.round((overallScore * 0.8 + Math.random() * 2)),
      rationale: 'Project scope aligns with identified innovation opportunities.'
    },
    overall_score: Math.round(overallScore * 10) / 10,
    primary_dimension: primary,
    top_opportunities: [
      {
        opportunity: `Leverage ${technologies[0]} for scaling impact`,
        dimension: 'emerging_tech',
        approach: 'Technology partnership'
      },
      {
        opportunity: `Address ${disruptions[0]} through foresight planning`,
        dimension: 'foresight',
        approach: 'Strategic advisory'
      }
    ],
    key_insight: `Strong potential in ${primary.replace('_', ' ')} with ${country} context.`
  };
}

async function scoreWithAI(project: Project, prompt: string, model: string, apiKey: string) {
  if (model.startsWith('gpt')) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt.replace('{{project_json}}', JSON.stringify(project)) }],
        temperature: 0.7
      })
    });
    
    if (!response.ok) throw new Error('OpenAI API failed');
    const data = await response.json();
    const content = data.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return { projectId: project.id, success: true, ...JSON.parse(jsonMatch[0]) };
    }
    throw new Error('No JSON in response');
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
        messages: [{ role: 'user', content: prompt.replace('{{project_json}}', JSON.stringify(project)) }]
      })
    });
    
    if (!response.ok) throw new Error('Anthropic API failed');
    const data = await response.json();
    const content = data.content[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return { projectId: project.id, success: true, ...JSON.parse(jsonMatch[0]) };
    }
    throw new Error('No JSON in response');
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { projects, prompt, model, apiKey } = await req.json();
    const results = [];
    
    for (const project of projects) {
      try {
        if (model === 'demo' || !apiKey) {
          results.push(generateDemoScore(project));
        } else {
          results.push(await scoreWithAI(project, prompt, model, apiKey));
        }
      } catch (error: any) {
        results.push({
          projectId: project.id,
          success: false,
          error: error.message
        });
      }
    }
    
    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});