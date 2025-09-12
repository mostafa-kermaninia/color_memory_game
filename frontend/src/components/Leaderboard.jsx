import { useEffect, useState } from "react";
import DefaultAvatar from "../assets/default-avatar.png";

// ✨ کامپوننت ردیف بازیکن با طراحی کاملاً جدید
function PlayerRow({ player, currentUserData }) {
    if (!player || !player.telegramId) return null;
    const isCurrentUser = player.telegramId === currentUserData?.id;

    return (
        <li
            className={`flex items-center justify-between py-3 px-4 rounded-xl my-2 transition-all duration-300 ${
                isCurrentUser
                    ? "bg-gradient-to-r from-indigo-500 to-purple-600 ring-2 ring-indigo-300 scale-[1.03] shadow-lg" // استایل ویژه و بسیار زیباتر برای کاربر فعلی
                    : "bg-black/20"
            }`}
        >
            <span className="w-8 text-center font-bold text-slate-300 text-lg">
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
                    className="w-10 h-10 rounded-full shadow-md border-2 border-slate-500/50"
                />
                <span className="truncate font-medium text-white">
                    {player.firstName || player.username || "Anonymous"}
                </span>
            </div>
            <span className="w-16 text-right font-bold text-indigo-300 text-lg">
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
    const [leaderboard, setLeaderboard] = useState({
        top: [],
        currentUser: null,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setLoading(true);
            const token = localStorage.getItem("jwtToken");
            if (!token) {
                setError("Authentication failed. Please restart the app.");
                setLoading(false);
                return;
            }
            try {
                const url = `${API_BASE}/leaderboard?eventId=${eventId || ""}`;
                const res = await fetch(url, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });
                if (!res.ok)
                    throw new Error(`HTTP error! Status: ${res.status}`);
                const data = await res.json();
                if (data.status === "success") {
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
    }, [API_BASE, eventId, userData]);

    const banner = finalScore !== null && (
        <div className="mb-4 text-center text-2xl font-bold text-white">
            Your Final Score:{" "}
            <span className="text-yellow-400">{finalScore}</span>
        </div>
    );

    const isCurrentUserInTopList = leaderboard.top.some(
        (p) => p.telegramId === leaderboard.currentUser?.telegramId
    );

    if (loading) {
        return (
            <div className="text-white text-lg animate-pulse">
                Loading Leaderboard...
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full max-w-md mx-auto bg-red-800/50 backdrop-blur-xl rounded-2xl shadow-2xl p-6 text-white border border-red-700">
                <h2 className="text-xl font-bold text-center text-red-300 mb-4">
                    Error
                </h2>
                <p className="text-center">{error}</p>
                <button
                    onClick={onHome}
                    className="w-full mt-6 py-3 bg-slate-700/80 text-white rounded-lg font-semibold hover:bg-slate-600 transition"
                >
                    Back to Lobby
                </button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md mx-auto bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl p-6 text-white border border-slate-700">
            {banner}
            <h2 className="text-3xl font-bold text-center text-indigo-400 mb-6">
                {eventId ? "Event Leaderboard" : "Free Mode Leaderboard"}
            </h2>

            <ul>
                {leaderboard.top.length > 0 ? (
                    leaderboard.top.map((player) => (
                        <PlayerRow
                            key={player.telegramId}
                            player={player}
                            currentUserData={userData}
                        />
                    ))
                ) : (
                    <li className="text-center py-8 text-slate-400">
                        No scores yet. Be the first!
                    </li>
                )}
                {!isCurrentUserInTopList && leaderboard.currentUser && (
                    <>
                        <li className="text-center text-slate-500 my-2 font-bold">
                            ...
                        </li>
                        <PlayerRow
                            player={leaderboard.currentUser}
                            currentUserData={userData}
                        />
                    </>
                )}
            </ul>

            <div className="mt-8 space-y-3">
                <button
                    onClick={() => onReplay(eventId)}
                    className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg text-lg"
                >
                    {finalScore !== null ? "Play Again" : "Play"}
                </button>
                <button
                    onClick={onHome}
                    className="w-full py-3 bg-slate-700/80 text-white rounded-xl font-semibold hover:bg-slate-600 transition"
                >
                    Back to Lobby
                </button>
            </div>
        </div>
    );
}
