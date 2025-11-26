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

function extractDomain(project: Project): string {
  const name = project.project_name.toLowerCase();
  const sector = project.sector1?.Name || '';

  const domainMap: Record<string, string> = {
    'digital': 'digital economy',
    'health': 'healthcare',
    'education': 'education',
    'transport': 'transportation',
    'agriculture': 'agriculture',
    'energy': 'energy',
    'water': 'water',
    'urban': 'urban development',
    'financial': 'financial services',
    'trade': 'trade',
    'climate': 'climate',
    'infrastructure': 'infrastructure',
    'governance': 'governance',
    'environment': 'environment'
  };

  for (const [keyword, domain] of Object.entries(domainMap)) {
    if (name.includes(keyword) || sector.toLowerCase().includes(keyword)) {
      return domain;
    }
  }

  if (sector) return sector.toLowerCase();

  return 'development';
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
  if (name.includes('digital')) technologies.push('Digital Public Infrastructure', 'Cloud-native platforms');
  if (name.includes('data')) technologies.push('Data analytics', 'AI/ML systems');
  if (name.includes('ai')) technologies.push('Artificial Intelligence', 'Machine Learning');
  if (name.includes('blockchain')) technologies.push('Blockchain', 'Distributed ledgers');
  if (name.includes('iot')) technologies.push('Internet of Things', 'IoT sensors');
  if (name.includes('cloud')) technologies.push('Cloud computing', 'Edge computing');
  if (technologies.length === 0) technologies.push('Digital platforms', 'Automation systems');

  const disruptions = [];
  if (name.includes('transform')) disruptions.push('Digital transformation', 'Process automation');
  if (name.includes('climate')) disruptions.push('Climate adaptation', 'Green transition');
  if (name.includes('sustain')) disruptions.push('Sustainability transition', 'Circular economy');
  if (disruptions.length === 0) disruptions.push('Market evolution', 'Regulatory changes');

  const examples = [];
  if (country.toLowerCase().includes('africa')) {
    examples.push('Regional tech hubs and accelerators', 'Mobile innovation challenges');
  } else if (country.toLowerCase().includes('asia')) {
    examples.push('Government innovation labs', 'Smart city hackathons');
  } else {
    examples.push('Innovation challenges', 'Public-private partnerships');
  }

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
      applications: [`${technologies[0]} for service delivery`, `${technologies[1] || 'Digital solutions'} for efficiency`],
      evidence: `Research indicates active technology innovation in this domain with proven applications of ${technologies[0]} and ${technologies[1] || 'related technologies'}.`
    },
    foresight: {
      score: Math.round(foresightScore * 10) / 10,
      disruptions,
      horizon: foresightScore > 6.5 ? 'long-term' : 'medium-term',
      evidence: `Domain facing significant ${disruptions[0]} requiring forward planning. ${foresightScore > 7 ? 'High' : 'Moderate'} disruption velocity suggests strong need for future-proofing.`
    },
    collective_intelligence: {
      score: Math.round(collectiveScore * 10) / 10,
      ecosystem_activity: collectiveScore > 6.5 ? 'high' : 'moderate',
      examples,
      evidence: `${collectiveScore > 6.5 ? 'Vibrant' : 'Growing'} ecosystem with precedent for innovation engagement. Examples include ${examples[0]} demonstrating active community.`
    },
    relevance: {
      score: Math.round((overallScore * 0.8 + Math.random() * 2)),
      rationale: `Project's ${extractDomain(project)} focus strongly aligns with identified innovation opportunities in ${country}. The $${amount} investment scale provides significant opportunity for Lab engagement.`
    },
    overall_score: Math.round(overallScore * 10) / 10,
    primary_dimension: primary,
    top_opportunities: [
      {
        opportunity: `Deploy ${technologies[0]} proof-of-value to demonstrate scalable solutions`,
        dimension: 'emerging_tech',
        approach: 'Proof of Value'
      },
      {
        opportunity: `Conduct Three Horizons foresight workshop to address ${disruptions[0]}`,
        dimension: 'foresight',
        approach: 'Foresight Workshop'
      },
      {
        opportunity: `Launch innovation challenge leveraging local ecosystem for ${extractDomain(project)} solutions`,
        dimension: 'collective_intelligence',
        approach: 'Innovation Challenge'
      }
    ],
    key_insight: `${country}'s ${extractDomain(project)} sector shows ${overallScore > 7 ? 'exceptional' : 'significant'} potential for Innovation Lab engagement, particularly through ${primary.replace('_', ' ')} approaches. The project's scale and scope create opportunities for demonstrating impact at national level.`
  };
}

async function scoreWithAI(project: Project, prompt: string, model: string, apiKey: string) {
  const country = Array.isArray(project.countryname) ? project.countryname[0] : project.countryname;
  const amount = project.totalamt;
  const domain = extractDomain(project);

  console.log(`Scoring project with AI: ${project.project_name} in ${domain} domain`);

  let enrichedPrompt = prompt
    .replace(/\[\[project_name\]\]/g, project.project_name)
    .replace(/\[\[country\]\]/g, country)
    .replace(/\[\[amount\]\]/g, amount)
    .replace(/\[\[domain\]\]/g, domain);

  const searchInstructions = `
IMPORTANT: Before scoring, you MUST conduct web searches for the following:

1. Search for: "${domain} emerging technology innovation AI blockchain IoT digital transformation"
2. Search for: "${domain} future trends 2030 disruption transformation ${country}"
3. Search for: "${domain} innovation challenge hackathon startup ecosystem ${country}"

Use the search results to provide specific, evidence-based scoring with real examples of:
- Specific technologies being deployed in this domain
- Named companies, startups, or initiatives
- Actual innovation challenges or hackathons
- Concrete disruptions and trends with sources
- Real ecosystem players and accelerators

Your analysis must be grounded in actual search findings, not generic knowledge.
`;

  enrichedPrompt = searchInstructions + "\n\n" + enrichedPrompt;

  if (model.startsWith('gpt')) {
    const messages: any[] = [{ role: 'user', content: enrichedPrompt }];

    // Use gpt-4o-search-preview for web search, otherwise use specified model
    let actualModel = model;
    const requestBody: any = {
      model: actualModel,
      messages,
      temperature: 0.7,
      max_tokens: 3000
    };

    // If model is gpt-4o or similar, switch to search preview model for web search
    if (model.includes('gpt-4o') || model === 'gpt-4-turbo-preview' || model === 'gpt-4') {
      actualModel = 'gpt-4o-search-preview-2025-03-11';
      requestBody.model = actualModel;
      // Add web_search_options to enable search
      requestBody.web_search_options = {};
      console.log(`Using ${actualModel} with web search enabled`);
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API failed: ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    console.log('OpenAI response received, extracting JSON...');

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
        max_tokens: 4000,
        messages: [{ role: 'user', content: enrichedPrompt }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Anthropic API failed: ${errorText}`);
    }

    const data = await response.json();
    const content = data.content[0].text;

    console.log('Anthropic response received, extracting JSON...');

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
        console.error(`Error scoring project ${project.id}:`, error);
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
    console.error('Score-projects error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});