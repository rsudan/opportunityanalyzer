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
  regionname?: string;
}

interface SearchResult {
  title: string;
  url: string;
  description: string;
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

async function performWebSearch(query: string, count: number = 10): Promise<SearchResult[]> {
  try {
    console.log(`Performing thorough search: ${query}`);

    // Use SearXNG public instance for better results
    const searxUrl = `https://searx.be/search?q=${encodeURIComponent(query)}&format=json&engines=google,bing,duckduckgo&categories=general`;

    const response = await fetch(searxUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.warn(`Search failed with status ${response.status}, falling back to alternative`);
      return await fallbackSearch(query, count);
    }

    const data = await response.json();
    const results: SearchResult[] = [];

    if (data.results && Array.isArray(data.results)) {
      for (let i = 0; i < Math.min(count, data.results.length); i++) {
        const result = data.results[i];
        if (result.url && result.title) {
          results.push({
            url: result.url,
            title: result.title,
            description: result.content || result.title
          });
        }
      }
    }

    console.log(`Found ${results.length} results for: ${query}`);
    return results;
  } catch (error) {
    console.error(`Search error for "${query}":`, error);
    return await fallbackSearch(query, count);
  }
}

async function fallbackSearch(query: string, count: number): Promise<SearchResult[]> {
  try {
    // Fallback to DuckDuckGo Lite API
    const ddgUrl = `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`;

    const response = await fetch(ddgUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      console.warn(`Fallback search also failed`);
      return [];
    }

    const html = await response.text();
    const results: SearchResult[] = [];

    // Parse DuckDuckGo Lite results - simpler HTML structure
    const linkRegex = /<a[^>]+href="([^"]+)"[^>]*class="result-link"[^>]*>([^<]+)<\/a>/g;
    const snippetRegex = /<td[^>]+class="result-snippet"[^>]*>([^<]+)<\/td>/g;

    const links: Array<{url: string, title: string}> = [];
    let linkMatch;
    while ((linkMatch = linkRegex.exec(html)) !== null && links.length < count) {
      links.push({
        url: linkMatch[1],
        title: linkMatch[2].trim()
      });
    }

    const snippets: string[] = [];
    let snippetMatch;
    while ((snippetMatch = snippetRegex.exec(html)) !== null && snippets.length < count) {
      snippets.push(snippetMatch[1].trim());
    }

    for (let i = 0; i < Math.min(links.length, count); i++) {
      results.push({
        url: links[i].url,
        title: links[i].title,
        description: snippets[i] || links[i].title
      });
    }

    console.log(`Fallback found ${results.length} results`);
    return results;
  } catch (error) {
    console.error(`Fallback search error:`, error);
    return [];
  }
}

function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) {
    return "No specific results found in search.";
  }

  return results
    .map((r, i) => `${i + 1}. ${r.title}\n   ${r.description}\n   Source: ${r.url}`)
    .join('\n\n');
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

  console.log(`Scoring project: ${project.project_name} (${domain} in ${country})`);

  // Perform comprehensive web searches
  console.log('Conducting web research...');

  // Create specific, detailed search queries
  const projectKeywords = project.project_name.toLowerCase().split(' ').filter(w => w.length > 4).slice(0, 3).join(' ');
  const sectorName = project.sector1?.Name || domain;

  const searches = [
    {
      name: 'Emerging Technology',
      query: `"${sectorName}" "${country}" AI machine learning IoT blockchain digital innovation 2024 2025 technology adoption`
    },
    {
      name: 'Innovation Ecosystem',
      query: `"${country}" "${domain}" innovation ecosystem startup accelerator tech hub incubator challenge hackathon`
    },
    {
      name: 'Future Trends',
      query: `"${sectorName}" future trends 2030 disruption forecast "${country}" development digital transformation`
    },
    {
      name: 'Case Studies',
      query: `"${domain}" "${country}" case study implementation success pilot project technology deployment`
    },
    {
      name: 'Market Analysis',
      query: `"${country}" "${sectorName}" market analysis innovation investment funding startup companies`
    },
    {
      name: 'Technology Companies',
      query: `"${domain}" technology companies "${country}" vendors solutions providers platforms startups`
    },
    {
      name: 'World Bank Innovation',
      query: `"World Bank" "${country}" "${domain}" innovation technology digital development project`
    },
    {
      name: 'Research Publications',
      query: `"${sectorName}" "${country}" research report whitepaper study analysis innovation technology 2023 2024`
    }
  ];

  const searchResults: Record<string, SearchResult[]> = {};

  for (const search of searches) {
    const results = await performWebSearch(search.query, 10);
    searchResults[search.name] = results;
    console.log(`Completed ${search.name}: ${results.length} results`);
    // Delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 800));
  }

  const totalResults = Object.values(searchResults).reduce((sum, results) => sum + results.length, 0);
  console.log(`Total search results collected: ${totalResults}`);

  // Build enriched prompt with actual search results
  const searchContext = Object.entries(searchResults)
    .map(([name, results]) => {
      return `### ${name} Search Results\n${formatSearchResults(results)}`;
    })
    .join('\n\n');

  let enrichedPrompt = prompt
    .replace(/\[\[project_name\]\]/g, project.project_name)
    .replace(/\[\[country\]\]/g, country)
    .replace(/\[\[amount\]\]/g, amount)
    .replace(/\[\[domain\]\]/g, domain);

  const webResearchSection = `
=== WEB RESEARCH FINDINGS ===

I conducted comprehensive web searches to inform this analysis. Below are the actual search results:

${searchContext}

=== END WEB RESEARCH ===

IMPORTANT: Base your scoring EXCLUSIVELY on the web research findings above. Reference specific:
- Named technologies, companies, and initiatives found in the search results
- Concrete examples of innovation challenges, hackathons, or ecosystem activities
- Actual trends and disruptions mentioned in the sources
- Real case studies and applications
- Include source URLs where relevant

If search results are limited, acknowledge this and provide a conservative score.

`;

  enrichedPrompt = webResearchSection + "\n\n" + enrichedPrompt;

  console.log(`Calling AI model: ${model}`);

  if (model.startsWith('gpt')) {
    const messages: any[] = [{ role: 'user', content: enrichedPrompt }];

    const requestBody: any = {
      model: model,
      messages,
      temperature: 0.1,
      max_tokens: 4000
    };

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
        max_tokens: 4096,
        temperature: 0.1,
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
          console.log(`Using demo mode for project: ${project.id}`);
          results.push(generateDemoScore(project));
        } else {
          console.log(`Scoring with AI for project: ${project.id}`);
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