import React, {
    useState,
    useEffect,
    useCallback,
    useMemo,
    useRef,
} from "react";
import TimerCircle from "./components/TimerCircle";
import Leaderboard from "./components/Leaderboard";
import GameLobby from "./components/GameLobby";
import ColorPads from "./components/ColorPads"; // کامپوننت جدید بازی
import DefaultAvatar from "./assets/default-avatar.png";
import { motion, AnimatePresence } from "framer-motion";
import MuteButton from "./components/MuteButton";

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
    const [timeLeft, setTimeLeft] = useState(0);
    const [isPlayerTurn, setIsPlayerTurn] = useState(false);
    const [litPad, setLitPad] = useState(null);
    const [message, setMessage] = useState("حافظه رنگ‌ها");
    const [finalScore, setFinalScore] = useState(null);
    const [membershipRequired, setMembershipRequired] = useState(false);
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const soundsRef = useRef({
        lobby: new Audio(`${process.env.PUBLIC_URL}/sounds/lobby.mp3`),
        game: new Audio(`${process.env.PUBLIC_URL}/sounds/game.mp3`),
    });
    const currentMusicKey = useRef(null);

    const [isMuted, setIsMuted] = useState(() => {
        const savedMuteState = localStorage.getItem("isMuted");
        return savedMuteState ? JSON.parse(savedMuteState) : false;
    });
    const toggleMute = () => {
        setIsMuted((prevMuted) => {
            const newMutedState = !prevMuted;
            localStorage.setItem("isMuted", JSON.stringify(newMutedState));
            return newMutedState;
        });
    };

    const timerId = useRef(null);

    const handleGameOver = useCallback(
        async (score) => {
            // playSoundEffect("gameover"); // <--- پخش صدای پایان بازی

            console.log(
                `%c[handleGameOver] Game Over. Final Score to be saved: ${score}`,
                "color: #DC143C;"
            );

            setMessage(`You lose! Your reach level ${score}`);
            setFinalScore(score);
            setIsPlayerTurn(false);

            // if (score > 0 && token) {
            //     try {
            //         await fetch(`${API_BASE}/gameOver`, {
            //             method: "POST",
            //             headers: {
            //                 "Content-Type": "application/json",
            //                 Authorization: `Bearer ${token}`,
            //             },
            //             body: JSON.stringify({
            //                 score: score,
            //                 eventId: currentGameEventId,
            //             }),
            //         });
            //     } catch (err) {
            //         console.error("Failed to save score:", err);
            //         setError("Error in saving the score");
            //     }
            // }

            setTimeout(() => {
                setView("board");
                setLeaderboardKey(Date.now());
            }, 500);
        },
        [token, currentGameEventId]
    );

    const clearResources = useCallback(() => {
        if (timerId.current) clearInterval(timerId.current);

        timerId.current = null;
    }, []);

    const handleTimeout = useCallback(async () => {
        try {
            // try to display the leaderboard.
            const response = await fetch(`${API_BASE}/timeOut`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`, // Pass the auth token
                },
            });

            if (!response.ok) {
                // If the backend call fails, still end the game on the frontend
                console.error("Timeout API call failed");
                handleGameOver(level - 1); // Show leaderboard with the score we had
                return;
            }

            const data = await response.json();
            // Now, call handleGameOver with the CONFIRMED final score from the server
            handleGameOver(data.score);
            // ▲▲▲ END OF FIX ▲▲▲
        } catch (error) {
            console.error("Error during timeout handling:", error);
            handleGameOver(level - 1); // Fallback to end the game
        }
    }, [token, level, handleGameOver]); // Added `token` and `score` to dependency array

    const runTimer = useCallback(async (time) =>{
        clearResources();
        setTimeLeft(time);

        timerId.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearResources();
                    handleTimeout();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    },
    [level, clearResources, handleTimeout]
    );


    useEffect(() => {
        const sounds = soundsRef.current;
        const musicKey = view === "board" ? "lobby" : view;
        const musicToPlay = sounds[musicKey];

        // توقف موسیقی در حال پخش قبلی
        if (currentMusicKey.current && sounds[currentMusicKey.current]) {
            sounds[currentMusicKey.current].pause();
            sounds[currentMusicKey.current].currentTime = 0;
        }

        // اگر بازی بی‌صدا بود یا موسیقی برای این صفحه وجود نداشت، هیچ کاری نکن
        if (
            isMuted ||
            !musicToPlay ||
            !["lobby", "game", "board"].includes(view)
        ) {
            currentMusicKey.current = null;
            return;
        }

        // پخش موسیقی جدید
        musicToPlay.loop = true;
        musicToPlay.play().catch((error) => {
            console.log("Audio autoplay was prevented.");
        });
        currentMusicKey.current = view;

        // هنگام بسته شدن کامپوننت، تمام صداها را متوقف کن
        return () => {
            Object.values(sounds).forEach((sound) => sound.pause());
        };
    }, [view, isMuted]); // isMuted را به وابستگی‌ها اضافه کنید

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

    const handlePadClick = useCallback(
        async (color) => {
            if (!isPlayerTurn) return;

            // افکت صوتی و نمایش پد روشن شده مثل قبل
            // playSoundEffect("click");
            setLitPad(color);
            setTimeout(() => setLitPad(null), 200);

            const newPlayerSequence = [...playerSequence, color];
            setPlayerSequence(newPlayerSequence);

            // --- شروع منطق جدید ---
            // اگر کاربر هنوز تمام دنباله را وارد نکرده، منتظر بمان
            if (newPlayerSequence.length < sequence.length) {
                return;
            }

            clearResources();
            // وقتی کاربر تمام دنباله را وارد کرد، آن را برای اعتبارسنجی به سرور بفرست
            setIsPlayerTurn(false); // بلافاصله نوبت بازیکن را تمام کن

            try {
                const response = await fetch(`${API_BASE}/validate-move`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ playerSequence: newPlayerSequence }),
                });
                const data = await response.json();

                if (data.action === "next_level") {
                    // اگر سرور گفت "مرحله بعد"
                    setTimeLeft(data.time);
                    runTimer(data.time);
                    setSequence(data.sequence);
                    setLevel(data.sequence.length);
                    playSequence(data.sequence);
                } else if (data.action === "game_over") {
                    // اگر سرور گفت "بازی تمام"
                    handleGameOver(data.score);
                }
            } catch (err) {
                console.error("Error validating move:", err);
                setError("Connection error. Game over.");
                handleGameOver(level); // در صورت خطا، بازی تمام می‌شود
            }
            // --- پایان منطق جدید ---
        },
        [
            isPlayerTurn,
            playerSequence,
            sequence,
            level,
            token,
            playSequence,
            handleGameOver,
        ]
    );

    const startGame = useCallback(
        async (eventId) => {
            Object.values(soundsRef.current).forEach((sound) => {
                sound.load(); // لود کردن صداها
            });
            if (!isAuthenticated || !token) {
                setError("Please authenticate first");
                setView("auth");
                return;
            }

            setCurrentGameEventId(eventId);
            setFinalScore(null);
            setView("game");
            setMessage("Ready?");

            try {
                const response = await fetch(`${API_BASE}/start-game`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ eventId }), // ارسال eventId
                });

                if (!response.ok) {
                    throw new Error("Could not start the game.");
                }
                const data = await response.json();
                runTimer(data.time);
                // تنظیم بازی با دنباله‌ی دریافت شده از سرور
                setSequence(data.sequence);
                setLevel(1); // بازی از مرحله ۱ شروع می‌شود
                setPlayerSequence([]);

                // نمایش دنباله اولیه به کاربر
                setTimeout(() => playSequence(data.sequence), 1000);
            } catch (err) {
                console.error("Error starting game:", err);
                setError("Failed to start a new game.");
                setView("lobby");
            }
        },
        [isAuthenticated, token, playSequence]
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
                    <TimerCircle total={level * 5} left={timeLeft} />
                </div>
            ),
        [view, message, level, handlePadClick, litPad, isPlayerTurn, timeLeft]
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
        <div className="relative min-h-dvh flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 text-white p-4 font-[Vazirmatn]">
            <MuteButton isMuted={isMuted} onToggle={toggleMute} />

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
                className="absolute bottom-4 right-4 w-16 opacity-70 pointer-events-none"
            />
        </div>
    );
}

export default React.memo(App);
