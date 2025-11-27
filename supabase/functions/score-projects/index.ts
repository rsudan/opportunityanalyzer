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
    console.log(`Performing search: ${query}`);

    // Try multiple search backends in sequence
    const searchMethods = [
      () => searchWithDuckDuckGo(query, count),
      () => searchWithBrave(query, count),
    ];

    for (const method of searchMethods) {
      try {
        const results = await method();
        if (results.length > 0) {
          console.log(`Found ${results.length} results for: ${query}`);
          return results;
        }
      } catch (error) {
        console.warn(`Search method failed, trying next...`, error);
      }
    }

    console.warn(`All search methods failed for: ${query}`);
    return [];
  } catch (error) {
    console.error(`Search error for "${query}":`, error);
    return [];
  }
}

async function searchWithDuckDuckGo(query: string, count: number): Promise<SearchResult[]> {
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; WorldBankBot/1.0)'
    }
  });

  if (!response.ok) {
    throw new Error(`DDG API returned ${response.status}`);
  }

  const data = await response.json();
  const results: SearchResult[] = [];

  if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
    for (const topic of data.RelatedTopics.slice(0, count)) {
      if (topic.FirstURL && topic.Text) {
        results.push({
          url: topic.FirstURL,
          title: topic.Text.substring(0, 100),
          description: topic.Text
        });
      }
    }
  }

  return results;
}

async function searchWithBrave(query: string, count: number): Promise<SearchResult[]> {
  // Brave Search API fallback - using their public API
  const url = `https://search.brave.com/search?q=${encodeURIComponent(query)}&source=web`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  if (!response.ok) {
    throw new Error(`Brave search returned ${response.status}`);
  }

  // Parse HTML response (simplified extraction)
  const html = await response.text();
  const results: SearchResult[] = [];

  // Extract URLs and titles from Brave search results
  const urlPattern = /<a[^>]+href="([^"]+)"[^>]*class="[^"]*result[^"]*"[^>]*>([^<]+)<\/a>/gi;
  let match;

  while ((match = urlPattern.exec(html)) !== null && results.length < count) {
    results.push({
      url: match[1],
      title: match[2],
      description: match[2]
    });
  }

  return results;
}


function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) {
    return "No specific results found in search.";
  }

  return results
    .map((r, i) => `${i + 1}. ${r.title}\n   ${r.description}\n   Source: ${r.url}`)
    .join('\n\n');
}

async function scoreWithAI(project: Project, prompt: string, model: string, apiKey: string): Promise<any> {
  const country = Array.isArray(project.countryname) ? project.countryname[0] : project.countryname;
  const amount = project.totalamt;
  const domain = extractDomain(project);

  console.log(`Scoring project: ${project.project_name} (${domain} in ${country})`);

  console.log('Conducting web research...');

  const projectKeywords = project.project_name.toLowerCase().split(' ').filter(w => w.length > 4).slice(0, 3).join(' ');
  const sectorName = project.sector1?.Name || domain;

  const searches = [
    {
      name: 'Emerging Technology',
      query: `\"${sectorName}\" \"${country}\" AI machine learning IoT blockchain digital innovation 2024 2025 technology adoption`
    },
    {
      name: 'Innovation Ecosystem',
      query: `\"${country}\" \"${domain}\" innovation ecosystem startup accelerator tech hub incubator challenge hackathon`
    },
    {
      name: 'Future Trends',
      query: `\"${sectorName}\" future trends 2030 disruption forecast \"${country}\" development digital transformation`
    },
    {
      name: 'Case Studies',
      query: `\"${domain}\" \"${country}\" case study implementation success pilot project technology deployment`
    },
    {
      name: 'Market Analysis',
      query: `\"${country}\" \"${sectorName}\" market analysis innovation investment funding startup companies`
    },
    {
      name: 'Technology Companies',
      query: `\"${domain}\" technology companies \"${country}\" vendors solutions providers platforms startups`
    },
    {
      name: 'World Bank Innovation',
      query: `\"World Bank\" \"${country}\" \"${domain}\" innovation technology digital development project`
    },
    {
      name: 'Research Publications',
      query: `\"${sectorName}\" \"${country}\" research report whitepaper study analysis innovation technology 2023 2024`
    }
  ];

  const searchResults: Record<string, SearchResult[]> = {};

  for (const search of searches) {
    const results = await performWebSearch(search.query, 10);
    searchResults[search.name] = results;
    console.log(`Completed ${search.name}: ${results.length} results`);
    await new Promise(resolve => setTimeout(resolve, 800));
  }

  const totalResults = Object.values(searchResults).reduce((sum, results) => sum + results.length, 0);
  console.log(`Total search results collected: ${totalResults}`);

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

  console.log(`Calling OpenAI model: ${model}`);

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
    return {
      projectId: project.id,
      success: true,
      web_search_results: searchResults,
      ...JSON.parse(jsonMatch[0])
    };
  }
  throw new Error('No JSON in response');
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { projects, prompt, model, apiKey } = await req.json();

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: 'OpenAI API key is required. Please configure your API key in Settings.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!model || model === 'demo' || !model.startsWith('gpt')) {
      return new Response(
        JSON.stringify({
          error: 'Valid OpenAI model required. Please select GPT-4o, GPT-4 Turbo, or GPT-3.5 Turbo in Settings.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = [];

    for (const project of projects) {
      try {
        console.log(`Scoring with AI for project: ${project.id}`);
        results.push(await scoreWithAI(project, prompt, model, apiKey));
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