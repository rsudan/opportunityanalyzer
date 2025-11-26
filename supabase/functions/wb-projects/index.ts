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
    const requestedPageSize = parseInt(url.searchParams.get('pageSize') || '50');

    // Fetch more rows than requested to account for filtering
    const fetchSize = 200;
    const offset = ((parseInt(page) - 1) * fetchSize).toString();

    let wbUrl = `${WB_API_URL}?format=json&rows=${fetchSize}&os=${offset}`;
    wbUrl += '&fl=id,project_name,countryname,countryshortname,regionname,status,totalamt,sector1,mjsector1Name,theme1,mjtheme_namecode,boardapprovaldate,approvalfy,url';
    wbUrl += '&srt=boardapprovaldate+desc';

    // Get filter parameters
    const statuses = url.searchParams.get('statuses');
    const statusList = statuses ? statuses.split(',') : [];

    const regions = url.searchParams.get('regions');
    const keyword = url.searchParams.get('keyword');
    const yearFrom = url.searchParams.get('yearFrom');
    const yearTo = url.searchParams.get('yearTo');

    console.log('Fetching from World Bank API:', wbUrl);
    console.log('Filters - Statuses:', statusList, 'Region:', regions, 'Keyword:', keyword);

    const response = await fetch(wbUrl);

    if (!response.ok) {
      throw new Error(`World Bank API returned ${response.status}`);
    }

    const data = await response.json();
    let projectsArray = data.projects ? Object.values(data.projects) : [];

    console.log(`Fetched ${projectsArray.length} projects from API`);

    // Apply status filter
    if (statusList.length > 0) {
      const beforeFilter = projectsArray.length;
      projectsArray = projectsArray.filter((p: any) =>
        statusList.includes(p.status)
      );
      console.log(`Status filter: ${beforeFilter} -> ${projectsArray.length} projects`);
    }

    // Apply region filter
    if (regions && regions !== 'All') {
      const beforeFilter = projectsArray.length;
      projectsArray = projectsArray.filter((p: any) => p.regionname === regions);
      console.log(`Region filter: ${beforeFilter} -> ${projectsArray.length} projects`);
    }

    // Apply year filter
    if (yearFrom && yearTo) {
      const fromYear = parseInt(yearFrom);
      const toYear = parseInt(yearTo);
      const beforeFilter = projectsArray.length;
      projectsArray = projectsArray.filter((p: any) => {
        if (!p.approvalfy) return false;
        const year = parseInt(p.approvalfy);
        return year >= fromYear && year <= toYear;
      });
      console.log(`Year filter: ${beforeFilter} -> ${projectsArray.length} projects`);
    }

    // Apply keyword filter
    if (keyword) {
      const searchTerm = keyword.toLowerCase();
      const beforeFilter = projectsArray.length;
      projectsArray = projectsArray.filter((p: any) =>
        (p.project_name && p.project_name.toLowerCase().includes(searchTerm)) ||
        (p.countryname && JSON.stringify(p.countryname).toLowerCase().includes(searchTerm))
      );
      console.log(`Keyword filter: ${beforeFilter} -> ${projectsArray.length} projects`);
    }

    // Paginate results
    const totalFiltered = projectsArray.length;
    const startIdx = 0;
    const endIdx = Math.min(requestedPageSize, projectsArray.length);
    const paginatedProjects = projectsArray.slice(startIdx, endIdx);

    console.log(`Returning ${paginatedProjects.length} projects (total filtered: ${totalFiltered})`);

    return new Response(
      JSON.stringify({
        total: totalFiltered,
        projects: paginatedProjects,
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