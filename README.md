**Project**

- **Name**: `tgbot-webhook-vc` (Next.js app)
 - **Purpose**: 本项目是一个使用 Next.js App Router 构建的轻量服务，提供若干页面和代理 Bilibili 直播间信息的 HTTP API，便于其它服务通过本项目间接调用 Bilibili 接口。

**Implemented Routes**

- **`/` (Root)**: 静态首页（`src/app/page.tsx`），包含导航链接到 `/tgbot` 和 `/tgbot/init`。
- **`/tgbot`**: 简易 Telegram Bot 仪表盘占位页（`src/app/tgbot/page.tsx`）。
- **`/tgbot/init`**: Bot 初始化说明/界面占位页（`src/app/tgbot/init/page.tsx`）。
- **`/api/bili/liveinfo`**: 单 UID 查询
	- **Methods**: `GET`, `POST`
	- **Description**: 调用内部共用 helper `src/lib/bili.ts` 中的 `fetchLiveInfoByUid`，查询单个主播的直播间信息。
	- **GET params**: `?uid=<uid>`
	- **POST body**:
		- `application/json`: `{ "uid": 123456 }`
		- `application/x-www-form-urlencoded`: `uid=123456`
		- 也兼容原始文本 `uid=123456` 或其他常见格式（会尝试解析 JSON、表单、文本）。
	- **Response (success)**:
		```json
		{ "apisuccess": true, "data": { /* 原始返回结构或提取后的字段 */ } }
		```
	- **Error responses**: 返回合适的 HTTP 状态码与 `{ "error": "message" }`。

- **`/api/bili/liveinfos`**: 批量 UID 查询（你要求的主功能）
	- **Methods**: `GET`, `POST`
	- **Description**: 代理并调用 Bilibili 接口 `https://api.live.bilibili.com/room/v1/Room/get_status_info_by_uids`，并将结果映射为你需要的字段集合，返回对象形式，键为 UID。
	- **GET params supported**:
		- `?uids[]=123&uids[]=456`
		- `?uids=123,456`
		- `?uids=123&uids=456`
	- **POST body supported**:
		- `application/json`: `{ "uids": [123,456] }`
		- `application/x-www-form-urlencoded` / `multipart/form-data`: `uids[]=123`（可重复）或 `uids=123,456`
		- 原始文本 `uids=123,456` 或 `uids[]=123&uids[]=456`
	- **Response (success)**:
		```json
		{
			"apisuccess": true,
			"data": {
				"123": { "uid":123, "uname":"...", "title":"...", "room_id":0, "short_id":0, "live_time":0, "live_status":0, "tags":"" },
				"456": { ... }
			}
		}
		```
	- **Fields returned for each UID**: `uid`, `uname`, `title`, `room_id`, `short_id`, `live_time`, `live_status`, `tags`。实现里会对上游字段作容错（例如 `roomid`/`room_id`、`tag_name` / `tags` 等别名）。
	- **Error responses**: 返回 `{ "error": "message" }` 并设置合适状态码（400/502/500）。

**Local Development**

- **Install dependencies**: 使用你偏好的包管理器（仓库内常见命令）：
	```powershell
	pnpm install
	# 或者
	npm install
	# 或
	yarn
	```
- **Run dev server**:
	```powershell
	pnpm dev
	# 或 npm run dev
	```
- **Open in browser**: `http://localhost:3000`

**Examples**

- Single UID GET:
	```bash
	curl "http://localhost:3000/api/bili/liveinfo?uid=1430207441"
	```
- Single UID POST (JSON):
	```powershell
	curl -X POST "http://localhost:3000/api/bili/liveinfo" -H "Content-Type: application/json" -d '{"uid":1430207441}'
	```
- Batch GET:
	```bash
	curl "http://localhost:3000/api/bili/liveinfos?uids[]=1430207441&uids[]=19950084"
	```
- Batch POST (JSON):
	```powershell
	curl -X POST "http://localhost:3000/api/bili/liveinfos" -H "Content-Type: application/json" -d '{"uids":[1430207441,19950084]}'
	```

注意（PowerShell）: Windows PowerShell 对引号与方括号的解析不同，推荐用单引号包裹 JSON，或使用 `curl.exe` 明确调用原生 curl：
```powershell
# 推荐
curl -X POST "http://localhost:3000/api/bili/liveinfos" -H "Content-Type: application/json" -d '{"uids":[1430207441,19950084]}'

# 或明确使用 curl.exe
& curl.exe -X POST "http://localhost:3000/api/bili/liveinfos" -H "Content-Type: application/json" -d "{\"uids\":[1430207441,19950084]}"
```

**Response Notes & Conventions**

- **Top-level success key**: 返回时使用 `"apisuccess": true` 表示成功；出错时返回 `{ "error": "..." }` 并适当设置 HTTP 状态码。
- **Field mapping**: 上游 Bilibili 字段可能有多种命名（例如 `roomid` / `room_id`），实现中已做容错并提取你指定的字段子集。

**Deployment (Vercel)**

- 将项目推到 GitHub（或你偏好的 Git 远程），然后在 Vercel 上导入仓库并部署。Next.js App Router 的 API Route（`src/app/api/.../route.ts`）在 Vercel 上会自动生效。
- 无需额外环境变量。注意一下点：
	- 生产环境频率高时建议加缓存或速率限制，避免被上游（Bilibili）限制。

**Next Steps (建议)**

- 添加短期缓存（例如内存 + 30s TTL）以降低上游请求压力。
- 增加速率限制或认证（例如仅允许内网/特定 token 调用）。
- 为主要 API 添加简单的单元/集成测试。

**Files Of Interest**

- `src/lib/bili.ts` — 共用的 Bilibili 查询 helper。
- `src/app/api/bili/liveinfo/route.ts` — 单 UID API。
- `src/app/api/bili/liveinfos/route.ts` — 批量 UID API（返回对象，键为 UID）。
- `src/app/tgbot` — 演示页面。

如果你希望我把该 README 提交到仓库（commit）并生成一个合适的 commit message，我可以代劳；或者你想我把 README 翻译为英文版本也可以。 

