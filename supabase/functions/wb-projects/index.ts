import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const WB_API_URL = 'https://search.worldbank.org/api/v2/projects';

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const params = new URLSearchParams();
    
    params.set('format', 'json');
    params.set('fl', 'id,project_name,countryname,countryshortname,regionname,status,projectstatusdisplay,totalamt,sector1,mjsector1Name,theme1,mjtheme_namecode,boardapprovaldate,approvalfy,url');
    
    const regions = url.searchParams.get('regions');
    if (regions && regions !== 'All') {
      params.set('qterm', `regionname:"${regions}"`);
    }
    
    const statuses = url.searchParams.get('statuses');
    if (statuses) {
      const statusList = statuses.split(',');
      const statusQuery = statusList.map(s => `projectstatusdisplay:"${s}"`).join(' OR ');
      const existing = params.get('qterm');
      params.set('qterm', existing ? `${existing} AND (${statusQuery})` : `(${statusQuery})`);
    }
    
    const yearFrom = url.searchParams.get('yearFrom');
    const yearTo = url.searchParams.get('yearTo');
    if (yearFrom && yearTo) {
      params.set('appr_yr', `${yearFrom}:${yearTo}`);
    }
    
    const keyword = url.searchParams.get('keyword');
    if (keyword) {
      const existing = params.get('qterm');
      params.set('qterm', existing ? `${existing} AND ${keyword}` : keyword);
    }
    
    const page = url.searchParams.get('page') || '1';
    const pageSize = url.searchParams.get('pageSize') || '50';
    params.set('rows', pageSize);
    params.set('os', ((parseInt(page) - 1) * parseInt(pageSize)).toString());
    params.set('srt', 'boardapprovaldate desc');
    
    const wbUrl = `${WB_API_URL}?${params}`;
    const response = await fetch(wbUrl);
    const data = await response.json();

    const projectsArray = data.projects ? Object.values(data.projects) : [];

    return new Response(
      JSON.stringify({
        total: data.total || '0',
        projects: projectsArray,
        mock: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});