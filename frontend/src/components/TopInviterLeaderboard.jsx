// In src/components/TopInviterLeaderboard.jsx

import React, { useState, useEffect } from 'react';

const medals = ["🥇", "🥈", "🥉"];

const LeaderboardItem = ({ user, rank }) => {
    // ... (این کامپوننت بدون تغییر باقی می‌ماند) ...
    const rankContent = rank < 3 ? medals[rank] : `#${rank + 1}`;
    const itemStyle = rank < 3
        ? "bg-gradient-to-r from-yellow-500/30 to-orange-500/30 border-yellow-400/80"
        : "bg-white/10 border-white/20";

    return (
        <div className={`flex items-center justify-between p-3 my-2 rounded-lg border ${itemStyle} transition-all hover:scale-105`}>
            <div className="flex items-center">
                <span className="text-xl font-bold w-10 text-center text-yellow-300">{rankContent}</span>
                <div className="ml-3 text-left">
                    <p className="font-bold text-white">{user.firstName || user.username}</p>
                    {user.username && <p className="text-xs text-gray-300">@{user.username}</p>}
                </div>
            </div>
            <div className="text-right">
                <p className="text-lg font-bold text-white">{user.referral_count}</p>
                <p className="text-xs text-yellow-200/80">Invites</p>
            </div>
        </div>
    );
};

// +++ کامپوننت اصلی کاملا تغییر کرده است +++
const TopInviterLeaderboard = ({ API_BASE }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${API_BASE}/referral-leaderboard`);
                if (!response.ok) {
                    throw new Error("Failed to fetch data.");
                }
                const data = await response.json();
                setUsers(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, [API_BASE]); // هر زمان API_BASE تغییر کرد، دوباره fetch کن (معمولا یکبار)

    if (loading) {
        return <p className="text-center text-gray-400 mt-8 animate-pulse">Loading Leaderboard...</p>;
    }

    if (error) {
        return <p className="text-center text-red-400 mt-8">Could not load leaderboard.</p>;
    }

    return (
        <div className="w-full mt-8">
            <h3 className="text-2xl font-bold text-center text-white mb-4">🏆 Top Inviter's Leaderboard 🏆</h3>
            {users.length > 0 ? (
                <div>
                    {users.map((user, index) => (
                        <LeaderboardItem key={user.username || index} user={user} rank={index} />
                    ))}
                </div>
            ) : (
                <p className="text-center text-gray-400">No one has invited friends yet!</p>
            )}
        </div>
    );
};

export default TopInviterLeaderboard;