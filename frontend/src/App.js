import React, {
    useState,
    useEffect,
    useCallback,
    useRef,
    leaderboardContent,
    useMemo,
} from "react";
import ProblemCard from "./components/ProblemCard";
import AnswerButtons from "./components/AnswerButtons";
import TimerCircle from "./components/TimerCircle";
import Leaderboard from "./components/Leaderboard";
import DefaultAvatar from "./assets/default-avatar.png";
import GameLobby from "./components/GameLobby";

const ROUND_TIME = 15;
const API_BASE = "https://momis.studio/api";

function App() {
    const [problem, setProblem] = useState(null);
    const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState("auth");
    const [finalScore, setFinalScore] = useState(null);
    const [score, setScore] = useState(0);
    const [error, setError] = useState(null);
    const [leaderboardKey, setLeaderboardKey] = useState(Date.now());
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authLoading, setAuthLoading] = useState(true);
    const [token, setToken] = useState(
        () => localStorage.getItem("jwtToken") || null
    );
    const [userData, setUserData] = useState(() => {
        const saved = localStorage.getItem("userData");
        return saved ? JSON.parse(saved) : null;
    });
    const [gameActive, setGameActive] = useState(false);
    const [currentGameEventId, setCurrentGameEventId] = useState(null);

    const timerId = useRef(null);
    const abortControllerRef = useRef(null);

    const clearResources = useCallback(() => {
        if (timerId.current) clearInterval(timerId.current);
        if (abortControllerRef.current) abortControllerRef.current.abort();

        timerId.current = null;
        abortControllerRef.current = null;
    }, []);

    const handleGameOver = useCallback(
        (finalScore) => {
            clearResources();
            setProblem(null);
            setFinalScore(finalScore);
            setView("board");
            setLeaderboardKey(Date.now());
            setGameActive(false);
        },
        [clearResources]
    );

    const authenticateUser = useCallback(async () => {
        try {
            setAuthLoading(true);
            setError(null);

            if (!window.Telegram?.WebApp) {
                console.log(
                    "Running in non-Telegram environment, skipping authentication"
                );
                setIsAuthenticated(true);
                setView("home");
                return;
            }

            const initData = window.Telegram.WebApp.initData || "";
            if (!initData) {
                throw new Error("Telegram authentication data not found");
            }

            const response = await fetch(`${API_BASE}/telegram-auth`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ initData }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData?.message || "Authentication failed");
            }

            const data = await response.json();

            if (!data?.valid) {
                throw new Error(data?.message || "Invalid Telegram user");
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

    const submitAnswer = useCallback(
        async (answer) => {
            if (!problem || loading || !token) return;

            try {
                setLoading(true);
                setError(null);
                abortControllerRef.current = new AbortController();

                const response = await fetch(`${API_BASE}/answer`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ answer: Boolean(answer) }),
                    signal: abortControllerRef.current.signal,
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(
                        errorData.message || "Failed to submit answer"
                    );
                }

                const data = await response.json();

                if (data.status === "continue") {
                    setProblem(data.problem);
                    setScore(data.score);
                    startLocalTimer(data.time_left);
                } else {
                    handleGameOver(data.final_score);
                }
            } catch (err) {
                if (err.name !== "AbortError") {
                    console.error("Answer error:", err);
                    setError(err.message || "Failed to submit answer");

                    if (
                        err.message.includes("token") ||
                        err.message.includes("Unauthorized")
                    ) {
                        setIsAuthenticated(false);
                        setView("auth");
                    }
                }
            } finally {
                if (!abortControllerRef.current?.signal.aborted) {
                    setLoading(false);
                }
            }
        },
        [problem, loading, handleGameOver, token]
    );

    const handleTimeout = useCallback(async () => {
        const response = await fetch(`${API_BASE}/timeOut`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to submit answer");
        }
        const data = await response.json();
        handleGameOver(data.final_score);
    }, [handleGameOver]);

    const startLocalTimer = useCallback(
        (initialTime) => {
            clearResources();
            setTimeLeft(initialTime);

            timerId.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        handleTimeout();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        },
        [clearResources, handleTimeout]
    );

    // MODIFIED: The `startGame` function now accepts `eventId`
    const startGame = useCallback(
        async (eventId) => {
            setCurrentGameEventId(eventId); // شناسه رویداد این دور از بازی را به خاطر بسپار

            // It now takes eventId as an argument
            if (!isAuthenticated || !token) {
                setError("Please authenticate first");
                setView("auth");
                return;
            }

            try {
                setLoading(true);
                setError(null);
                setGameActive(true);

                const abortController = new AbortController();
                abortControllerRef.current = abortController;

                const response = await fetch(`${API_BASE}/start`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    // Send the eventId (which can be null) in the request body
                    body: JSON.stringify({ eventId }),
                    signal: abortController.signal,
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(
                        errorData.message ||
                            `Request failed with status ${response.status}`
                    );
                }

                const data = await response.json();

                if (!data || data.status !== "success") {
                    throw new Error(data?.message || "Invalid server response");
                }

                setProblem(data.problem);
                startLocalTimer(data.time_left ?? ROUND_TIME);
                setScore(data.score ?? 0);
                setView("game"); // Set the view to 'game' to start playing
            } catch (err) {
                if (err.name === "AbortError") {
                    console.log("Request was aborted");
                    return;
                }

                console.error("Game start error:", err);
                setError(
                    err.message.includes("Failed to fetch")
                        ? "Could not connect to server. Please check your connection."
                        : err.message
                );
                setGameActive(false);
                setView("lobby"); // On error, go back to the lobby, not 'home'
            } finally {
                if (!abortControllerRef.current?.signal.aborted) {
                    setLoading(false);
                }
            }
        },
        [startLocalTimer, isAuthenticated, token]
    );

    const handleImageError = useCallback((e) => {
        if (e.target.src !== DefaultAvatar) {
            e.target.src = DefaultAvatar;
        }
        e.target.onerror = null;
    }, []);

    useEffect(() => {
        const initAuth = async () => {
            if (token && userData) {
                setIsAuthenticated(true);
                setView("lobby");
                setAuthLoading(false);
            } else {
                await authenticateUser();
            }
        };

        initAuth();
        return () => clearResources();
    }, [authenticateUser, clearResources, token, userData]);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const handleLogout = useCallback(() => {
        localStorage.removeItem("jwtToken");
        localStorage.removeItem("userData");
        setToken(null);
        setUserData(null);
        setIsAuthenticated(false);
        setView("auth");
    }, []);

    const authContent = useMemo(() => {
        if (view !== "auth") return null;

        return (
            <div className="flex flex-col items-center gap-6 w-full max-w-md">
                <h2 className="text-2xl font-bold">Welcome to Math Game</h2>
                <p className="text-center">
                    {window.Telegram?.WebApp
                        ? "Please authenticate with Telegram to play the game."
                        : "This game is designed to run inside Telegram. Please open it in Telegram to play."}
                </p>
                {error && <p className="text-red-300">{error}</p>}
                {window.Telegram?.WebApp && (
                    <button
                        onClick={authenticateUser}
                        disabled={authLoading}
                        className={`px-6 py-3 bg-white text-indigo-600 rounded-xl text-xl font-bold ${
                            authLoading ? "opacity-50" : "hover:bg-gray-100"
                        }`}
                    >
                        {authLoading
                            ? "Authenticating..."
                            : "Authenticate with Telegram"}
                    </button>
                )}
            </div>
        );
    }, [view, authLoading, error, authenticateUser]);

    // NEW: This content will render the Game Lobby
    const lobbyContent = useMemo(() => {
        if (view !== "lobby") return null;

        // Pass the necessary user data and functions to the lobby component
        return (
            <GameLobby
                onGameStart={startGame}
                userData={userData}
                onLogout={handleLogout}
                onImageError={handleImageError}
            />
        );
    }, [view, startGame, userData, handleLogout, handleImageError]);
    // محتوای بازی
    const gameContent = useMemo(() => {
        if (view !== "game") return null;

        return problem ? (
            <div className="flex flex-col items-center gap-6 w-full max-w-md">
                <div className="flex justify-between w-full">
                    <p className="text-2xl font-bold">Score: {score}</p>
                    {userData && (
                        <div className="flex items-center gap-2">
                            <img
                                src={
                                    userData.photo_url
                                        ? `/api/avatar?url=${encodeURIComponent(
                                              userData.photo_url
                                          )}`
                                        : DefaultAvatar
                                }
                                alt="Profile"
                                className="w-12 h-12 rounded-full"
                                onError={handleImageError}
                            />
                            <span>{userData.first_name}</span>
                        </div>
                    )}
                </div>

                <ProblemCard text={problem} />
                <TimerCircle total={ROUND_TIME} left={timeLeft} />
                <AnswerButtons
                    onAnswer={submitAnswer}
                    disabled={loading || !gameActive}
                />
            </div>
        ) : (
            <button
                onClick={GameLobby}
                disabled={loading}
                className={`px-8 py-4 bg-white text-indigo-600 rounded-2xl text-2xl font-bold shadow-xl transition-transform ${
                    loading ? "opacity-50" : "hover:scale-105"
                }`}
            >
                {loading ? "Loading..." : "Start Game"}
            </button>
        );
    }, [
        view,
        problem,
        score,
        timeLeft,
        loading,
        submitAnswer,
        startGame,
        userData,
        gameActive,
    ]);

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
                    eventId={currentGameEventId} // شناسه رویداد ذخیره شده را به لیدربورد پاس بده
                />
            ),
        [view, leaderboardKey, finalScore, userData, currentGameEventId]
    );

    return (
        <div className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-4">
            {/* نمایش خطا */}
            {error && (
                <div
                    className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-md shadow-lg z-50 max-w-md text-center animate-fade-in"
                    role="alert"
                >
                    {error}
                    <button
                        onClick={() => setError(null)}
                        className="ml-2 text-white hover:text-gray-200"
                        aria-label="Close error message"
                    >
                        &times;
                    </button>
                </div>
            )}

            {authContent}
            {lobbyContent}
            {gameContent}
            {leaderboardContent}

            {/* لوگوی تیم */}
            <img
                src={`${process.env.PUBLIC_URL}/teamlogo.png`}
                alt="Team Logo"
                className="absolute bottom-4 right-4 w-24 opacity-70 pointer-events-none select-none"
                loading="lazy"
            />
        </div>
    );
}

export default React.memo(App);
