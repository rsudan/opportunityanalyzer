import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const WB_API_URL = 'https://search.worldbank.org/api/v3/projects';

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);

    const page = url.searchParams.get('page') || '1';
    const pageSize = url.searchParams.get('pageSize') || '50';
    const offset = ((parseInt(page) - 1) * parseInt(pageSize)).toString();

    let wbUrl = `${WB_API_URL}?format=json&rows=${pageSize}&os=${offset}`;
    wbUrl += '&fl=id,project_name,countryname,countryshortname,regionname,status,totalamt,sector1,mjsector1Name,theme1,mjtheme_namecode,boardapprovaldate,approvalfy,url';
    wbUrl += '&srt=boardapprovaldate+desc';

    console.log('Fetching from World Bank API:', wbUrl);

    const response = await fetch(wbUrl);

    if (!response.ok) {
      throw new Error(`World Bank API returned ${response.status}`);
    }

    const data = await response.json();

    let projectsArray = data.projects ? Object.values(data.projects) : [];

    const regions = url.searchParams.get('regions');
    if (regions && regions !== 'All') {
      projectsArray = projectsArray.filter((p: any) => p.regionname === regions);
    }

    const statuses = url.searchParams.get('statuses');
    if (statuses) {
      const statusList = statuses.split(',');
      projectsArray = projectsArray.filter((p: any) =>
        statusList.includes(p.status)
      );
    }

    const yearFrom = url.searchParams.get('yearFrom');
    const yearTo = url.searchParams.get('yearTo');
    if (yearFrom && yearTo) {
      const fromYear = parseInt(yearFrom);
      const toYear = parseInt(yearTo);
      projectsArray = projectsArray.filter((p: any) => {
        if (!p.approvalfy) return false;
        const year = parseInt(p.approvalfy);
        return year >= fromYear && year <= toYear;
      });
    }

    const keyword = url.searchParams.get('keyword');
    if (keyword) {
      const searchTerm = keyword.toLowerCase();
      projectsArray = projectsArray.filter((p: any) =>
        (p.project_name && p.project_name.toLowerCase().includes(searchTerm)) ||
        (p.countryname && JSON.stringify(p.countryname).toLowerCase().includes(searchTerm))
      );
    }

    return new Response(
      JSON.stringify({
        total: projectsArray.length,
        projects: projectsArray,
        mock: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
