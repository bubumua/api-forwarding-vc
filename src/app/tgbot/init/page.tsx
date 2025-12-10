import Link from "next/link";

export default function TgbotInitPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
            <main className="max-w-3xl p-12 bg-white dark:bg-[#0b0b0b] w-full">
                <h1 className="text-3xl font-bold mb-4 text-black dark:text-zinc-50">Telegram Bot Initialization</h1>
                <p className="mb-6 text-lg text-zinc-600 dark:text-zinc-400">This is the `/tgbot/init` page — put your bot setup UI or instructions here.</p>
                <div className="flex gap-4">
                    <Link href="/tgbot">
                        Back to Dashboard
                    </Link>
                    <Link href="/">
                        Home
                    </Link>
                </div>
            </main>
        </div>
    );
}
