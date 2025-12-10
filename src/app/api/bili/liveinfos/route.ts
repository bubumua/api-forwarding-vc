import { NextResponse } from 'next/server';

/*
    /api/bili/liveinfos

    Batch query Bilibili live room status for multiple UIDs.

    Supported methods: GET, POST

    GET query formats supported:
    - ?uids[]=123&uids[]=456
    - ?uids=123,456
    - ?uids=123&uids=456

    POST body formats supported:
    - application/json: { "uids": [123,456] }
    - application/x-www-form-urlencoded or multipart/form-data: uids[]=123 (repeated) or uids=123,456
    - raw text: "uids=123,456" or "uids[]=123&uids[]=456"

    Response format (this route):
    {
        "apisuccess": true,
        "data": {
            "123": { uid, uname, title, room_id, short_id, live_time, live_status, tags },
            "456": { ... }
        }
    }

    Error responses use standard JSON with HTTP status codes, e.g.
    - 400: missing uids parameter
    - 502: invalid response from upstream
    - 500: internal error

    Notes:
    - The implementation POSTs to Bilibili's
        https://api.live.bilibili.com/room/v1/Room/get_status_info_by_uids
        and maps the returned fields to the requested subset.
    - Keys in the returned `data` object are the requested UID strings.
*/

async function parseUidsFromRequest(request: Request): Promise<string[]> {
    const method = (request.method || 'GET').toUpperCase();

    if (method === 'GET') {
        const url = new URL(request.url);
        // support uids[] and uids (comma-separated or repeated)
        let uids = url.searchParams.getAll('uids[]');
        if (uids.length === 0) uids = url.searchParams.getAll('uids');
        if (uids.length === 0) {
            const raw = url.searchParams.get('uids');
            if (raw) uids = raw.split(',').map(s => s.trim()).filter(Boolean);
        }
        return uids.map(String);
    }

    // POST/other: try JSON first (more robust if client omitted or altered Content-Type)
    const ct = (request.headers.get('content-type') || '').toLowerCase();
    try {
        const body = await request.json().catch(() => null);
        if (body) {
            const u = body?.uids ?? body?.uids ?? [];
            if (Array.isArray(u)) return u.map(String);
            if (typeof u === 'string') return u.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
    } catch (e) {
        // ignore JSON parse errors and continue to other parsers
    }

    if (ct.includes('application/json')) {
        // if content-type explicitly JSON but above didn't return, attempt a safe parse
        const body = await request.json().catch(() => ({}));
        const u = body?.uids ?? body?.uids ?? [];
        if (Array.isArray(u)) return u.map(String);
        if (typeof u === 'string') return u.split(',').map((s: string) => s.trim()).filter(Boolean);
        return [];
    }

    if (ct.includes('application/x-www-form-urlencoded') || ct.includes('multipart/form-data')) {
        const form = await request.formData();
        let uids: string[] = [];
        // form may have repeated fields "uids[]" or "uids"
        for (const key of ['uids[]', 'uids']) {
            const values = form.getAll ? form.getAll(key) : [];
            if (values && values.length) {
                uids = values.map(v => String(v));
                break;
            }
        }
        // fallback: single field uids with comma separated
        if (uids.length === 0 && form.has('uids')) {
            const v = form.get('uids');
            if (v) uids = String(v).split(',').map(s => s.trim()).filter(Boolean);
        }
        return uids;
    }

    // fallback: raw text like "uids=1,2,3" or "uids[]=1&uids[]=2"
    const text = await request.text().catch(() => '');
    if (!text) return [];
    const params = new URLSearchParams(text);
    let uids = params.getAll('uids[]');
    if (uids.length === 0) uids = params.getAll('uids');
    if (uids.length === 0 && params.has('uids')) {
        uids = params.get('uids')!.split(',').map(s => s.trim()).filter(Boolean);
    }
    return uids.map(String);
}

function extractFields(info: any, requestedUid: string) {
    const uidVal = info?.uid ?? (Number(requestedUid) || requestedUid);
    return {
        uid: uidVal,
        uname: info?.uname ?? '',
        title: info?.title ?? '',
        room_id: info?.room_id ?? info?.roomid ?? 0,
        short_id: info?.short_id ?? info?.shortid ?? 0,
        live_time: info?.live_time ?? 0,
        live_status: info?.live_status ?? info?.liveStatus ?? 0,
        tags: info?.tags ?? info?.tag_name ?? ''
    };
}

async function callBiliStatusApi(uids: (string | number)[]) {
    const endpoint = 'https://api.live.bilibili.com/room/v1/Room/get_status_info_by_uids';
    // Use POST with JSON body to avoid long query strings
    const body = { uids: uids.map(u => Number(u)) };
    const resp = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/plain, */*',
            'User-Agent': 'Mozilla/5.0',
            'Referer': 'https://live.bilibili.com',
            'Origin': 'https://live.bilibili.com'
        },
        body: JSON.stringify(body)
    });
    const text = await resp.text().catch(() => '');
    let j = null as any;
    try { j = text ? JSON.parse(text) : null; } catch (e) { j = null; }
    return j;
}

export async function GET(request: Request) {
    return handle(request);
}

export async function POST(request: Request) {
    return handle(request);
}

async function handle(request: Request) {
    try {
        const uids = await parseUidsFromRequest(request);
        if (!uids || uids.length === 0) {
            return NextResponse.json({ error: 'missing uids parameter' }, { status: 400 });
        }

        const upstream = await callBiliStatusApi(uids);
        if (!upstream) {
            return NextResponse.json({ error: 'invalid response from upstream' }, { status: 502 });
        }

        // upstream expected shape: { code: 0, data: { "<uid>": { ... } }, ... }
        const data = upstream.data || {};

        // Build an object keyed by UID so callers get a simple lookup map.
        const resultObj: Record<string, any> = {};
        for (const u of uids) {
            const key = String(u);
            const info = data[key] ?? data[Number(key)] ?? {};
            resultObj[key] = extractFields(info, key);
        }

        // Return as object keyed by uid and use `apisuccess` key per project convention
        return NextResponse.json({ apisuccess: true, data: resultObj });
    } catch (e) {
        console.error('/api/bili/liveinfos error', e);
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
