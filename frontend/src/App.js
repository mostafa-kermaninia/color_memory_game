import React, { useState, useEffect, useCallback, useMemo } from "react";
import Leaderboard from "./components/Leaderboard";
import GameLobby from "./components/GameLobby";
import ColorPads from "./components/ColorPads"; // کامپوننت جدید بازی
import DefaultAvatar from "./assets/default-avatar.png";

const API_BASE = "https://memory.momis.studio/api"; // یا آدرس بک‌اند شما

function App() {
    // --- State های مربوط به احراز هویت و نمایش (بدون تغییر) ---
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

    // --- State های جدید مخصوص بازی حافظه رنگ ---
    const [sequence, setSequence] = useState([]);
    const [playerSequence, setPlayerSequence] = useState([]);
    const [level, setLevel] = useState(0);
    const [isPlayerTurn, setIsPlayerTurn] = useState(false);
    const [litPad, setLitPad] = useState(null); // کدام پد روشن شود
    const [message, setMessage] = useState("حافظه رنگ‌ها");
    const [finalScore, setFinalScore] = useState(null);

    // --- تابع کمکی برای ایجاد تاخیر ---
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    // --- منطق اصلی بازی جدید ---

    // نمایش دنباله رنگ‌ها به کاربر
    const playSequence = useCallback(async (currentSequence) => {
        setIsPlayerTurn(false);
        setMessage("دقت کن...");
        await sleep(1000); // تاخیر قبل از شروع نمایش
        for (const color of currentSequence) {
            setLitPad(color);
            await sleep(400); // مدت زمان روشن ماندن
            setLitPad(null);
            await sleep(200); // فاصله بین رنگ‌ها
        }
        setMessage("Your turn!");
        setIsPlayerTurn(true);
        setPlayerSequence([]);
    }, []);

    // frontend/src/App.js

    const nextLevel = useCallback(() => {
        console.log(
            `%c[nextLevel] Starting. Current level: ${level}, Current sequence length: ${sequence.length}`,
            "color: orange;"
        );

        const colors = ["green", "red", "yellow", "blue"];
        const nextColor = colors[Math.floor(Math.random() * colors.length)];

        // --- تغییر اصلی اینجاست ---
        // ما به React می‌گوییم که با آخرین مقدار قبلی کار کند
        setSequence((prevSequence) => {
            const newSequence = [...prevSequence, nextColor];
            playSequence(newSequence); // playSequence را به اینجا منتقل می‌کنیم
            return newSequence;
        });

        setLevel((prevLevel) => prevLevel + 1);
        // --- پایان تغییر ---
    }, [playSequence]); // <-- وابستگی sequence حذف شد چون دیگر لازم نیست

    // تابع پایان بازی و ذخیره امتیاز
    const handleGameOver = useCallback(
        async (score) => {
            setMessage(`You lose! Your reach level ${score}`);
            setFinalScore(score);
            setIsPlayerTurn(false);

            // ارسال امتیاز به بک‌اند (فقط اگر امتیازی کسب شده باشد)
            if (score > 0 && token) {
                try {
                    // این اندپوینت را بعداً در بک‌اند خواهیم ساخت
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
                    setError("خطا در ذخیره امتیاز");
                }
            }

            // نمایش لیدربورد بعد از چند ثانیه
            setTimeout(() => {
                setView("board");
                setLeaderboardKey(Date.now());
            }, 2000);
        },
        [token, currentGameEventId]
    );

    // مدیریت کلیک کاربر روی پدهای رنگی
    const handlePadClick = useCallback(
        (color) => {
            if (!isPlayerTurn) return;

            const newPlayerSequence = [...playerSequence, color];
            setPlayerSequence(newPlayerSequence);

            setLitPad(color); // روشن کردن پد کلیک شده برای بازخورد
            setTimeout(() => setLitPad(null), 200);

            // بررسی اینکه آیا کلیک کاربر درست بوده یا نه
            if (
                newPlayerSequence[newPlayerSequence.length - 1] !==
                sequence[newPlayerSequence.length - 1]
            ) {
                handleGameOver(level - 1); // کاربر باخته است، امتیاز مرحله قبل ثبت می‌شود
                return;
            }

            // اگر کاربر دنباله را کامل و درست وارد کرد
            if (newPlayerSequence.length === sequence.length) {
                setIsPlayerTurn(false);
                setTimeout(nextLevel, 1000); // رفتن به مرحله بعد با کمی تاخیر
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
            // --- لاگ تشخیصی شماره ۱ ---
            console.log(
                "%c[startGame] Game starting... Resetting state.",
                "color: green; font-weight: bold;"
            );
            // ---

            setCurrentGameEventId(eventId);

            // --- این خطوط باید اضافه شوند تا بازی ریست شود ---
            setSequence([]);
            setPlayerSequence([]);
            setLevel(0);
            setFinalScore(null);
            // --- پایان بخش اضافه شده ---

            setView("game");
            setMessage("Ready?");

            // شروع مرحله اول با تاخیر
            setTimeout(() => {
                // --- لاگ تشخیصی شماره ۳ ---
                console.log(
                    "%c[startGame] setTimeout triggered. Calling nextLevel().",
                    "color: blue;"
                );
                // ---
                nextLevel();
            }, 1500);
        },
        [nextLevel]
    ); // وابستگی‌ها صحیح است و نیازی به تغییر ندارد
    // --- توابع احراز هویت و کمکی (تقریبا بدون تغییر) ---
    const authenticateUser = useCallback(async () => {
        setAuthLoading(true);
        setError(null);
        try {
            const initData = window.Telegram?.WebApp?.initData;
            if (!initData) {
                // برای تست در مرورگر معمولی
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
    }, []); // فقط یکبار در اولین رندر اجرا شود

    // --- مدیریت نمایش کامپوننت‌ها (Render Logic) ---
    const authContent = useMemo(
        () =>
            view === "auth" && (
                <div className="text-center">
                    <h2 className="text-2xl font-bold">
                        Welcome to color memory game{" "}
                    </h2>
                    {authLoading ? (
                        <p>authenticating...</p>
                    ) : (
                        <button onClick={authenticateUser}>Authenticate</button>
                    )}
                </div>
            ),
        [view, authLoading, authenticateUser]
    );

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
                    onReplay={() => setView("lobby")}
                    onHome={() => setView("lobby")}
                    userData={userData}
                    eventId={currentGameEventId}
                />
            ),
        [view, leaderboardKey, finalScore, userData, currentGameEventId]
    );

    return (
        <div className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 text-white p-4 font-[Vazirmatn]">
            {error && (
                <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-md shadow-lg z-50">
                    {error}
                </div>
            )}

            {authContent}
            {lobbyContent}
            {gameContent}
            {leaderboardContent}

            <img
                src={`${process.env.PUBLIC_URL}/teamlogo.png`}
                alt="Team Logo"
                className="absolute bottom-4 right-4 w-24 opacity-70 pointer-events-none"
            />
        </div>
    );
}

export default React.memo(App);
