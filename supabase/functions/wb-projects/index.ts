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

    const page = parseInt(url.searchParams.get('page') || '1');
    const requestedPageSize = parseInt(url.searchParams.get('pageSize') || '50');

    // Get filter parameters
    const statuses = url.searchParams.get('statuses');
    const statusList = statuses ? statuses.split(',') : [];
    const regions = url.searchParams.get('regions');
    const keyword = url.searchParams.get('keyword');
    const yearFrom = url.searchParams.get('yearFrom');
    const yearTo = url.searchParams.get('yearTo');

    // When client-side filtering is needed, fetch more records to ensure we have enough
    const needsFiltering = statusList.length > 0 || (regions && regions !== 'All') || (yearFrom && yearTo);
    const fetchSize = needsFiltering ? 200 : requestedPageSize;
    const offset = ((page - 1) * fetchSize).toString();

    let wbUrl = `${WB_API_URL}?format=json&rows=${fetchSize}&os=${offset}`;
    wbUrl += '&fl=id,project_name,countryname,countryshortname,regionname,status,totalamt,sector1,mjsector1Name,theme1,mjtheme_namecode,boardapprovaldate,approvalfy,url';
    wbUrl += '&srt=boardapprovaldate+desc';

    // Use WB API keyword search if specified
    if (keyword) {
      wbUrl += `&qterm=${encodeURIComponent(keyword)}`;
    }

    console.log('Fetching from World Bank API:', wbUrl);
    console.log('Filters - Statuses:', statusList, 'Region:', regions, 'Year:', yearFrom, '-', yearTo);

    const response = await fetch(wbUrl);

    if (!response.ok) {
      throw new Error(`World Bank API returned ${response.status}`);
    }

    const data = await response.json();
    let projectsArray = data.projects ? Object.values(data.projects) : [];

    console.log(`Fetched ${projectsArray.length} projects from WB API`);

    // Debug: Show sample of fetched data
    if (projectsArray.length > 0) {
      const sample = projectsArray[0];
      console.log('Sample project:', {
        id: sample.id,
        status: sample.status,
        region: sample.regionname,
        date: sample.boardapprovaldate
      });
    }

    // Apply client-side filters
    if (statusList.length > 0) {
      const beforeFilter = projectsArray.length;
      projectsArray = projectsArray.filter((p: any) =>
        statusList.includes(p.status)
      );
      console.log(`Status filter (${statusList.join(',')}): ${beforeFilter} -> ${projectsArray.length} projects`);
    }

    if (regions && regions !== 'All') {
      const beforeFilter = projectsArray.length;
      projectsArray = projectsArray.filter((p: any) => p.regionname === regions);
      console.log(`Region filter: ${beforeFilter} -> ${projectsArray.length} projects`);
    }

    if (yearFrom && yearTo) {
      const fromYear = parseInt(yearFrom);
      const toYear = parseInt(yearTo);
      const beforeFilter = projectsArray.length;
      projectsArray = projectsArray.filter((p: any) => {
        // Extract year from boardapprovaldate (format: YYYY-MM-DDTHH:MM:SSZ)
        const date = p.boardapprovaldate;
        if (!date) return false;
        const year = parseInt(date.substring(0, 4));
        return year >= fromYear && year <= toYear;
      });
      console.log(`Year filter (${fromYear}-${toYear}): ${beforeFilter} -> ${projectsArray.length} projects`);
    }

    // Paginate the filtered results
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