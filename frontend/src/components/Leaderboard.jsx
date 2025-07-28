import { useEffect, useState } from "react";
import DefaultAvatar from "../assets/default-avatar.png";

// کامپوننت جداگانه برای خوانایی بهتر و نمایش هر سطر از لیدربورد
function PlayerRow({ player, currentUserData }) {
    // اگر اطلاعات بازیکن وجود نداشت، چیزی نمایش نده
    if (!player || !player.telegramId) return null;

    // چک می‌کنیم که آیا این سطر مربوط به کاربر فعلی است یا نه
    const isCurrentUser = player.telegramId === currentUserData?.id;

    return (
        <li
            className={`flex items-center justify-between py-2 px-3 rounded-xl my-1 transition-all duration-300 ${
                isCurrentUser
                    ? "bg-indigo-200 ring-2 ring-indigo-400 scale-105" // استایل ویژه برای کاربر فعلی
                    : "bg-white/60"
            }`}
        >
            {/* نمایش رتبه واقعی که از بک‌اند دریافت شده */}
            <span className="w-8 text-center font-bold text-slate-700">
                {player.rank}
            </span>

            <div className="flex-1 flex items-center gap-3 ml-4 overflow-hidden">
                <img
                    src={
                        player.photo_url
                            ? `/api/avatar?url=${encodeURIComponent(
                                  player.photo_url
                              )}`
                            : DefaultAvatar
                    }
                    alt={player.firstName || "Player"}
                    className="w-8 h-8 rounded-full shadow-sm"
                />
                <span className="truncate font-medium text-slate-800">
                    {player.firstName || player.username || "Anonymous"}
                </span>
            </div>

            <span className="w-16 text-right font-bold text-indigo-600">
                {player.score}
            </span>
        </li>
    );
}

export default function Leaderboard({
    API_BASE,
    onReplay,
    finalScore,
    onHome,
    userData,
    eventId,
}) {
    // استیت برای نگهداری ۵ نفر برتر و اطلاعات کاربر فعلی
    const [leaderboard, setLeaderboard] = useState({
        top: [],
        currentUser: null,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setLoading(true);
            const token = localStorage.getItem("jwtToken"); // گرفتن توکن از حافظه محلی

            // اگر توکن وجود نداشت، عملیات را متوقف کن
            if (!token) {
                setError("Authentication failed. Please restart the app.");
                setLoading(false);
                return;
            }

            try {
                // آدرس API به درستی eventId را مدیریت می‌کند
                let url = `${API_BASE}/leaderboard?eventId=${eventId || ""}`;

                const res = await fetch(url, {
                    headers: {
                        // **مهم:** ارسال توکن برای احراز هویت
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });

                if (!res.ok) {
                    throw new Error(`HTTP error! Status: ${res.status}`);
                }

                const data = await res.json();
                if (data.status === "success") {
                    // ذخیره ساختار جدید داده‌ها
                    setLeaderboard(
                        data.leaderboard || { top: [], currentUser: null }
                    );
                } else {
                    throw new Error(
                        data.message || "Failed to parse leaderboard data."
                    );
                }

                setError(null);
            } catch (e) {
                console.error("Fetch leaderboard error:", e);
                setError("Failed to load leaderboard.");
                setLeaderboard({ top: [], currentUser: null });
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
        // `userData` هم به وابستگی‌ها اضافه شد تا با تغییر کاربر، اطلاعات بروز شود
    }, [API_BASE, eventId, userData]);

    // بنر امتیاز نهایی کاربر
    const banner = finalScore !== null && (
        <div className="mb-4 text-center text-2xl font-bold text-indigo-700">
            Game Over! Your Score: {finalScore}
        </div>
    );

    // چک می‌کنیم آیا کاربر فعلی در لیست ۵ نفر برتر هست یا خیر
    const isCurrentUserInTopList = leaderboard.top.some(
        (player) => player.telegramId === leaderboard.currentUser?.telegramId
    );

    if (loading) {
        return (
            <div className="w-full max-w-md mx-auto bg-white/80 backdrop-blur p-6 rounded-3xl shadow-xl text-center">
                Loading...
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full max-w-md mx-auto bg-white/80 backdrop-blur p-6 rounded-3xl shadow-xl text-center text-red-500">
                {error}
            </div>
        );
    }

    return (
        <div className="w-full max-w-md mx-auto bg-white/80 backdrop-blur p-6 rounded-3xl shadow-xl text-slate-800">
            {banner}
            <h2 className="text-3xl font-bold text-center text-indigo-700 mb-4">
                {eventId ? "Event Leaderboard" : "Free Mode LeaderBoard"}
            </h2>

            <ul>
                {/* هدر جدول */}
                <li className="flex items-center justify-between py-2 px-3 font-semibold text-slate-600 mb-1">
                    <span className="w-8 text-center">#</span>
                    <span className="flex-1 text-left ml-4">Player</span>
                    <span className="w-16 text-right">Score</span>
                </li>

                {/* نمایش لیست ۵ نفر برتر */}
                {leaderboard.top.length > 0 ? (
                    leaderboard.top.map((player) => (
                        <PlayerRow
                            key={player.telegramId}
                            player={player}
                            currentUserData={userData}
                        />
                    ))
                ) : (
                    <li className="text-center py-4 text-gray-500">
                        No scores yet. Be the first!
                    </li>
                )}

                {/* اگر کاربر فعلی در ۵ نفر اول نبود، رتبه‌اش را جداگانه نمایش بده */}
                {!isCurrentUserInTopList && leaderboard.currentUser && (
                    <>
                        <li className="text-center text-gray-400 my-2 font-bold">
                            ...
                        </li>
                        <PlayerRow
                            player={leaderboard.currentUser}
                            currentUserData={userData}
                        />
                    </>
                )}
            </ul>

            <div className="mt-6 space-y-2">
                <button
                    onClick={() => onReplay(eventId)} // <-- تغییر کلیدی اینجاست
                    className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-semibold hover:bg-indigo-700 transition"
                >
                    Play Again
                </button>
                <button
                    onClick={onHome}
                    className="w-full py-2 bg-gray-200 text-gray-700 rounded-2xl font-semibold hover:bg-gray-300 transition"
                >
                    Back to Lobby
                </button>
            </div>
        </div>
    );
}
