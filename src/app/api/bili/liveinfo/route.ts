import { NextResponse } from 'next/server';
import { fetchLiveInfoByUid } from '../../../../lib/bili';

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const uid = url.searchParams.get('uid');
        if (!uid) {
            return NextResponse.json({ error: 'missing uid query parameter' }, { status: 400 });
        }

        // Try to parse numeric uid when possible
        const numeric = Number(uid);
        const param: string | number = Number.isFinite(numeric) && String(numeric) === uid ? numeric : uid;

        const result = await fetchLiveInfoByUid(param);
        // Note: use `apisuccess` (all-lowercase) for consistency across routes
        return NextResponse.json({ apisuccess: true, data: result });
    } catch (e) {
        console.error('API /api/bili/liveinfo error', e);
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const contentType = (request.headers.get('content-type') || '').toLowerCase();
        let uid: string | null = null;

        if (contentType.includes('application/json')) {
            const body = await request.json().catch(() => ({}));
            uid = body?.uid ?? null;
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
            const form = await request.formData();
            uid = form.get('uid')?.toString() ?? null;
        } else {
            // 兼容性：接收原始文本（例如 body = "uid=123"）或其他类型
            const text = await request.text().catch(() => '');
            const params = new URLSearchParams(text);
            uid = params.get('uid') ?? null;
        }

        if (!uid) {
            return NextResponse.json({ error: 'missing uid' }, { status: 400 });
        }

        const numeric = Number(uid);
        const param: string | number =
            Number.isFinite(numeric) && String(numeric) === uid ? numeric : uid;

        const result = await fetchLiveInfoByUid(param);
        // Note: use `apisuccess` (all-lowercase) for consistency across routes
        return NextResponse.json({ apisuccess: true, data: result });
    } catch (e) {
        console.error('/api/bili/liveinfo POST error', e);
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
