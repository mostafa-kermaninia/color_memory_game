import React, { useState, useEffect, useCallback, useMemo } from "react";
import Leaderboard from "./components/Leaderboard";
import GameLobby from "./components/GameLobby";
import ColorPads from "./components/ColorPads"; // کامپوننت جدید بازی
import DefaultAvatar from "./assets/default-avatar.png";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = "https://memory.momis.studio/api"; // یا آدرس بک‌اند شما

function App() {
    const [view, setView] = useState("auth"); // auth, lobby, game, board
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authLoading, setAuthLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userData, setUserData] = useState(() => {
        const saved = localStorage.getItem("userData");
        return saved ? JSON.parse(saved) : null;
    });
    const [token, setToken] = useState(
        () => localStorage.getItem("jwtToken") || null
    );
    const [leaderboardKey, setLeaderboardKey] = useState(Date.now());
    const [currentGameEventId, setCurrentGameEventId] = useState(null);

    const [sequence, setSequence] = useState([]);
    const [playerSequence, setPlayerSequence] = useState([]);
    const [level, setLevel] = useState(0);
    const [isPlayerTurn, setIsPlayerTurn] = useState(false);
    const [litPad, setLitPad] = useState(null);
    const [message, setMessage] = useState("حافظه رنگ‌ها");
    const [finalScore, setFinalScore] = useState(null);
    const [membershipRequired, setMembershipRequired] = useState(false);
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const playSequence = useCallback(async (currentSequence) => {
        setIsPlayerTurn(false);
        setMessage("Watch Closely...");
        await sleep(1000);
        for (const color of currentSequence) {
            setLitPad(color);
            await sleep(400);
            setLitPad(null);
            await sleep(200);
        }
        setMessage("Your turn!");
        setIsPlayerTurn(true);
        setPlayerSequence([]);
    }, []);

    const nextLevel = useCallback(() => {
        console.log(
            `%c[nextLevel] Starting. Current level: ${level}, Sequence length: ${sequence.length}`,
            "color: #FF8C00;"
        );

        const colors = ["green", "red", "yellow", "blue"];
        const nextColor = colors[Math.floor(Math.random() * colors.length)];

        setSequence((prevSequence) => {
            const newSequence = [...prevSequence, nextColor];
            playSequence(newSequence);
            return newSequence;
        });

        setLevel((prevLevel) => prevLevel + 1);
    }, [playSequence, level, sequence.length]);

    const handleGameOver = useCallback(
        async (score) => {
            console.log(
                `%c[handleGameOver] Game Over. Final Score to be saved: ${score}`,
                "color: #DC143C;"
            );

            setMessage(`You lose! Your reach level ${score}`);
            setFinalScore(score);
            setIsPlayerTurn(false);

            if (score > 0 && token) {
                try {
                    await fetch(`${API_BASE}/gameOver`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            score: score,
                            eventId: currentGameEventId,
                        }),
                    });
                } catch (err) {
                    console.error("Failed to save score:", err);
                    setError("Error in saving the score");
                }
            }

            setTimeout(() => {
                setView("board");
                setLeaderboardKey(Date.now());
            }, 500);
        },
        [token, currentGameEventId]
    );

    const handlePadClick = useCallback(
        (color) => {
            if (!isPlayerTurn) return;

            const newPlayerSequence = [...playerSequence, color];
            setPlayerSequence(newPlayerSequence);

            setLitPad(color);
            setTimeout(() => setLitPad(null), 200);

            if (
                newPlayerSequence[newPlayerSequence.length - 1] !==
                sequence[newPlayerSequence.length - 1]
            ) {
                handleGameOver(level - 1);
                return;
            }

            if (newPlayerSequence.length === sequence.length) {
                setIsPlayerTurn(false);
                setTimeout(nextLevel, 500);
            }
        },
        [
            isPlayerTurn,
            playerSequence,
            sequence,
            level,
            nextLevel,
            handleGameOver,
        ]
    );

    const startGame = useCallback(
        (eventId) => {
            console.log(
                `%c[startGame] STARTING NEW GAME. State BEFORE reset: level=${level}, sequence length=${sequence.length}`,
                "color: #00FF7F; font-weight: bold;"
            );

            setCurrentGameEventId(eventId);

            if (!isAuthenticated || !token) {
                setError("Please authenticate first");
                setView("auth");
                return;
            }

            setSequence([]);
            setPlayerSequence([]);
            setLevel(0);
            setFinalScore(null);

            setView("game");
            setMessage("Ready?");

            setTimeout(() => {
                console.log(
                    `%c[startGame -> setTimeout] Calling nextLevel(). State SHOULD BE reset now.`,
                    "color: #1E90FF;"
                );

                nextLevel();
            }, 1500);
        },
        [nextLevel, isAuthenticated, token, level, sequence.length]
    );
    const authenticateUser = useCallback(async () => {
        setAuthLoading(true);
        setError(null);
        setMembershipRequired(false); // در ابتدای هر تلاش، این حالت را ریست می‌کنیم

        try {
            const initData = window.Telegram?.WebApp?.initData;
            if (!initData) {
                console.warn("Running in non-Telegram environment.");
                setIsAuthenticated(true);
                setView("lobby");
                setAuthLoading(false);
                return;
            }

            const response = await fetch(`${API_BASE}/telegram-auth`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ initData }),
            });
            const data = await response.json();
            // ۲. بخش تشخیص خطای عضویت را اضافه می‌کنیم
            if (response.status === 403 && data.membership_required) {
                setError(data.message); // پیام خطا را از سرور می‌گیریم
                setMembershipRequired(true); // حالت نمایش پیام عضویت را فعال می‌کنیم
                setView("auth"); // در همین صفحه باقی می‌مانیم
                return; // از ادامه تابع خارج می‌شویم
            }
            if (!response.ok || !data.valid) {
                throw new Error(data.message || "Authentication failed");
            }

            setToken(data.token);
            setUserData(data.user);
            localStorage.setItem("jwtToken", data.token);
            localStorage.setItem("userData", JSON.stringify(data.user));
            setIsAuthenticated(true);
            setView("lobby");
        } catch (error) {
            console.error("Authentication error:", error);
            setError(error.message);
            setIsAuthenticated(false);
            setView("auth");
        } finally {
            setAuthLoading(false);
        }
    }, []);

    const handleLogout = useCallback(() => {
        localStorage.removeItem("jwtToken");
        localStorage.removeItem("userData");
        setToken(null);
        setUserData(null);
        setIsAuthenticated(false);
        setView("auth");
    }, []);

    const handleImageError = useCallback((e) => {
        if (e.target.src !== DefaultAvatar) {
            e.target.src = DefaultAvatar;
        }
    }, []);

    useEffect(() => {
        if (token && userData) {
            setIsAuthenticated(true);
            setView("lobby");
            setAuthLoading(false);
        } else {
            authenticateUser();
        }
    }, [authenticateUser, token, userData]);
    // frontend/src/App.js

    // frontend/src/App.js

    const authContent = useMemo(() => {
        // اگر view برابر با 'auth' نباشد، چیزی نمایش نده
        if (view !== "auth") return null;

        // محتوای اصلی صفحه با انیمیشن‌ها
        const content = (
            <>
                <motion.h1
                    className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    Color Memory
                </motion.h1>

                {/* اگر خطای عضویت وجود داشت، پیام و دکمه‌های عضویت را نمایش بده */}
                {membershipRequired ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="w-full max-w-xs"
                    >
                        <p className="text-lg text-red-400 mb-4">
                            {error || "Please join our channels to play."}
                        </p>
                        <div className="space-y-3">
                            {/* **مهم:** این لینک‌ها را با مقادیر واقعی خود از فایل .env یا ecosystem.config.js جایگزین کنید */}
                            <a
                                href="https://t.me/MOMIS_studio"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors"
                            >
                                📢 Join Channel
                            </a>
                            <a
                                href="https://t.me/MOMIS_community"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors"
                            >
                                💬 Join Group
                            </a>
                            <button
                                onClick={authenticateUser}
                                className="mt-4 w-full py-2 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors"
                            >
                                ✅ I've Joined, Try Again
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    // در غیر این صورت، حالت عادی ورود را نمایش بده
                    <>
                        <motion.p
                            className="text-lg text-gray-300 mb-8"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            Ready to challenge your mind?
                        </motion.p>

                        {authLoading ? (
                            <p className="text-lg text-gray-400 animate-pulse">
                                Connecting...
                            </p>
                        ) : (
                            <motion.button
                                onClick={authenticateUser}
                                className="px-8 py-3 bg-blue-600 text-white rounded-xl text-xl font-bold shadow-lg hover:bg-blue-700 transition-all duration-300"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Login with Telegram
                            </motion.button>
                        )}
                    </>
                )}
                {/* نمایش خطاهای عمومی دیگر */}
                {!membershipRequired && error && (
                    <p className="text-red-400 mt-4">{error}</p>
                )}
            </>
        );

        return (
            <div className="flex flex-col items-center justify-center text-center h-screen px-4">
                {content}
            </div>
        );
    }, [view, authLoading, error, authenticateUser, membershipRequired]);
    const lobbyContent = useMemo(
        () =>
            view === "lobby" && (
                <GameLobby
                    onGameStart={startGame}
                    userData={userData}
                    onLogout={handleLogout}
                    onImageError={handleImageError}
                />
            ),
        [view, startGame, userData, handleLogout, handleImageError]
    );

    const gameContent = useMemo(
        () =>
            view === "game" && (
                <div className="flex flex-col items-center gap-6 w-full max-w-md text-center">
                    <h1 className="text-3xl font-bold h-10">{message}</h1>
                    <p className="text-xl">Level: {level}</p>
                    <ColorPads
                        onPadClick={handlePadClick}
                        litPad={litPad}
                        playerTurn={isPlayerTurn}
                    />
                </div>
            ),
        [view, message, level, handlePadClick, litPad, isPlayerTurn]
    );

    const leaderboardContent = useMemo(
        () =>
            view === "board" && (
                <Leaderboard
                    key={leaderboardKey}
                    API_BASE={API_BASE}
                    finalScore={finalScore}
                    onReplay={startGame}
                    onHome={() => setView("lobby")}
                    userData={userData}
                    eventId={currentGameEventId}
                />
            ),
        [
            view,
            leaderboardKey,
            finalScore,
            startGame,
            userData,
            currentGameEventId,
        ]
    );

    return (
        <div className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 text-white p-4 font-[Vazirmatn]">
            {error && (
                <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-md shadow-lg z-50">
                    {error}
                </div>
            )}
            <AnimatePresence mode="wait">
                <motion.div
                    key={view} // کلید انیمیشن، نام view فعلی است
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="w-full flex flex-col items-center justify-center"
                >
                    {view === "auth" && authContent}
                    {view === "lobby" && lobbyContent}
                    {view === "game" && gameContent}
                    {view === "board" && leaderboardContent}
                </motion.div>
            </AnimatePresence>

            <img
                src={`${process.env.PUBLIC_URL}/teamlogo.png`}
                alt="Team Logo"
                className="absolute bottom-4 right-4 w-24 opacity-70 pointer-events-none"
            />
        </div>
    );
}

export default React.memo(App);
