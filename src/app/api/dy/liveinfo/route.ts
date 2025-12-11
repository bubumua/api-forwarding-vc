import { NextResponse } from 'next/server';

const EXTERNAL_API = 'https://douyin.wtf/api/douyin/web/handler_user_profile';

async function callDouyin(sec_user_id: string) {
    const url = `${EXTERNAL_API}?sec_user_id=${encodeURIComponent(sec_user_id)}`;
    const res = await fetch(url, {
        method: 'GET',
        headers: {
            accept: 'application/json',
        },
    });
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`douyin api error: ${res.status} ${res.statusText} ${text}`);
    }
    const json = await res.json().catch(() => null);
    if (!json) throw new Error('douyin api returned invalid json');
    return json;
}

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const sec_user_id = url.searchParams.get('sec_user_id') || url.searchParams.get('sec_uid');
        if (!sec_user_id) {
            return NextResponse.json({ error: 'missing sec_user_id query parameter' }, { status: 400 });
        }

        const apiRes = await callDouyin(sec_user_id);
        // extract fields from apiRes.data.user
        const user = apiRes?.data?.user ?? {};
        const out = {
            follower_count: user?.follower_count ?? null,
            max_follower_count: user?.max_follower_count ?? null,
            ip_location: user?.ip_location ?? null,
            live_status: user?.live_status ?? null,
            nickname: user?.nickname ?? null,
            room_id: user?.room_id ?? null,
            sec_uid: user?.sec_uid ?? null,
            uid: user?.uid ?? null,
            unique_id: user?.unique_id ?? null,
        };

        return NextResponse.json({ apisuccess: true, data: out });
    } catch (e) {
        console.error('/api/dy/liveinfo GET error', e);
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const contentType = (request.headers.get('content-type') || '').toLowerCase();
        let sec_user_id: string | null = null;

        if (contentType.includes('application/json')) {
            const body = await request.json().catch(() => ({}));
            sec_user_id = body?.sec_user_id ?? body?.sec_uid ?? null;
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
            const form = await request.formData();
            sec_user_id = form.get('sec_user_id')?.toString() ?? form.get('sec_uid')?.toString() ?? null;
        } else {
            const text = await request.text().catch(() => '');
            const params = new URLSearchParams(text);
            sec_user_id = params.get('sec_user_id') ?? params.get('sec_uid') ?? null;
        }

        if (!sec_user_id) {
            return NextResponse.json({ error: 'missing sec_user_id' }, { status: 400 });
        }

        const apiRes = await callDouyin(sec_user_id);
        const user = apiRes?.data?.user ?? {};
        const out = {
            follower_count: user?.follower_count ?? null,
            max_follower_count: user?.max_follower_count ?? null,
            ip_location: user?.ip_location ?? null,
            live_status: user?.live_status ?? null,
            nickname: user?.nickname ?? null,
            room_id: user?.room_id ?? null,
            sec_uid: user?.sec_uid ?? null,
            uid: user?.uid ?? null,
            unique_id: user?.unique_id ?? null,
        };

        return NextResponse.json({ apisuccess: true, data: out });
    } catch (e) {
        console.error('/api/dy/liveinfo POST error', e);
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

