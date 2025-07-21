import { useEffect, useState } from "react";
import DefaultAvatar from "../assets/default-avatar.png"; // Assuming you have this asset for players without a photo

// ## 1. Accept `eventId` as a new prop
export default function Leaderboard({
    API_BASE,
    onReplay,
    finalScore,
    onHome,
    userData,
    eventId,
}) {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setLoading(true);
            try {
                // ## 2. Build the URL dynamically based on the eventId
                // This will fetch the correct leaderboard from the backend
                let url = `${API_BASE}/leaderboard?limit=100`;
                if (eventId) {
                    url += `&eventId=${eventId}`;
                }
                // If eventId is null, the backend will correctly fetch the "Free Play" leaderboard

                const res = await fetch(url);
                if (!res.ok) {
                    throw new Error("Failed to fetch leaderboard");
                }
                const data = await res.json();
                setRows(data.leaderboard || []);
                setError(null);
            } catch (e) {
                console.error(e);
                setError("Failed to load leaderboard");
                setRows([]);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
        // ## 3. Add `eventId` to the dependency array
        // This ensures the leaderboard re-fetches when you switch between event and free play views
    }, [API_BASE, eventId]);

    const banner = finalScore !== null && (
        <div className="mb-4 text-center text-2xl font-bold text-indigo-700">
            Game Over! Your Score: {finalScore}
        </div>
    );

    if (loading) {
        return (
            <div className="w-full max-w-md mx-auto bg-white/80 backdrop-blur p-6 rounded-3xl shadow-xl text-center">
                Loading leaderboard...
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
            {/* ## 4. Display a dynamic title */}
            <h2 className="text-3xl font-bold text-center text-indigo-700 mb-4">
                {eventId ? "Event Leaderboard" : "Global Leaderboard"}
            </h2>

            <ul>
                <li className="flex items-center justify-between py-2 px-3 font-semibold text-slate-600 mb-1">
                    <span className="w-8 text-center">#</span>
                    <span className="flex-1 text-left ml-4">Player</span>
                    <span className="w-16 text-right">Score</span>
                </li>

                {rows.length > 0 ? (
                    rows.map((player, index) => (
                        <li
                            // ## 5. Use `telegramId` for the key, as it's unique
                            key={player.telegramId}
                            // ## 6. Correctly highlight the current user's row
                            className={`flex items-center justify-between py-2 px-3 rounded-xl my-1 ${
                                player.telegramId === userData?.id
                                    ? "bg-indigo-200 ring-2 ring-indigo-400"
                                    : "bg-white/50"
                            }`}
                        >
                            <span className="w-8 text-center font-bold">
                                {index + 1}
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
                                    alt={player.firstName}
                                    className="w-8 h-8 rounded-full"
                                />
                                {/* ## 7. Display player's name correctly from backend response */}
                                <span className="truncate font-medium">
                                    {player.firstName ||
                                        player.username ||
                                        "Anonymous"}
                                </span>
                            </div>
                            <span className="w-16 text-right font-bold text-indigo-600">
                                {player.score}
                            </span>
                        </li>
                    ))
                ) : (
                    <li className="text-center py-4 text-gray-500">
                        No scores yet. Be the first!
                    </li>
                )}
            </ul>

            <button
                onClick={onReplay}
                className="mt-6 w-full py-3 bg-indigo-600 text-white rounded-2xl font-semibold hover:bg-indigo-700 transition"
            >
                Play Again
            </button>
            <button
                onClick={onHome}
                className="mt-2 w-full py-2 bg-gray-200 text-gray-700 rounded-2xl font-semibold hover:bg-gray-300 transition"
            >
                Back to Lobby
            </button>
        </div>
    );
}
