import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="w-full max-w-3xl p-12 bg-white dark:bg-[#0b0b0b] rounded-lg shadow-md">
        <h1 className="text-4xl font-bold mb-4 text-black dark:text-zinc-50">tgbot-webhook-vc</h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-300 mb-6">
          一个轻量的 Next.js 服务，用来代理查询 Bilibili 直播间信息并提供简单的演示页面。
        </p>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2 text-black dark:text-zinc-50">主要功能</h2>
          <ul className="list-disc list-inside text-zinc-600 dark:text-zinc-300">
            <li>单个主播查询：<code>/api/bili/liveinfo?uid=...</code>（GET/POST）</li>
            <li>批量查询：<code>/api/bili/liveinfos</code>（GET/POST，返回按 UID 索引的对象）</li>
            <li>演示页面：<code>/tgbot</code> 与 <code>/tgbot/init</code></li>
          </ul>
        </section>

        <div className="flex gap-3">
          <Link href="/tgbot" className="rounded-md bg-blue-600 px-4 py-2 text-white">Open TGBot Demo</Link>
          <Link href="/README.md" className="rounded-md border px-4 py-2">README</Link>
        </div>
      </main>
    </div>
  );
}
