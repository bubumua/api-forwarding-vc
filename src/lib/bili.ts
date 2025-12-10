async function fetchLiveInfoByUid(uid: string | number) {
    const url = `https://api.live.bilibili.com/room/v1/Room/getRoomInfoOld?mid=${uid}`;
    try {
        const resp = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Accept': 'application/json, text/plain, */*',
                'Referer': 'https://live.bilibili.com',
                'Origin': 'https://live.bilibili.com'
            }
        });
        const status = resp.status;
        const text = await resp.text().catch(() => '');
        let j = null;
        try { j = text ? JSON.parse(text) : null; } catch (e) { j = null; }
        const room = (j && j.data) || {};

        return {
            code: (j && j.code) ?? -1,
            message: (j && j.message) ?? (`raw response status=${status}`),
            liveStatus: room.liveStatus ?? 0,
            url: room.url ?? '',
            roomid: room.roomid ?? 0,
            _debug: { status, text: text.substring(0, 2000) }
        };
    } catch (e) {
        console.error('fetchLiveInfoByUid: exception', uid, e);
        return { code: -1, message: String(e), liveStatus: 0, url: '', roomid: 0 };
    }
}

async function fetchUnameByUid(uid: string | number) {
    const url = `https://api.live.bilibili.com/live_user/v1/Master/info?uid=${uid}`;
    try {
        const resp = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Accept': 'application/json, text/plain, */*',
                'Referer': 'https://live.bilibili.com',
                'Origin': 'https://live.bilibili.com'
            }
        });
        const status = resp.status;
        const text = await resp.text().catch(() => '');
        let j = null;
        try { j = text ? JSON.parse(text) : null; } catch (e) { j = null; }
        if (!j) {
            console.warn('fetchUnameByUid: failed to parse JSON', { uid, status, text: text.substring(0, 1000) });
        }
        return (j && j.data && j.data.info && j.data.info.uname) || String(uid);
    } catch (e) {
        console.error('fetchUnameByUid: exception', uid, e);
        return String(uid);
    }
}

export { fetchLiveInfoByUid, fetchUnameByUid };
