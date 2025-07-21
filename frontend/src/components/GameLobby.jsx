// frontend/src/components/GameLobby.jsx

import React, { useState, useEffect } from "react";
import DefaultAvatar from "../assets/default-avatar.png"; // Add this line
// Assuming you have a central api service to handle authenticated requests
// If not, you can use axios or fetch directly.
// For now, let's assume a fetch wrapper exists.
const api = {
    get: (url) =>
        fetch(url, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }).then((res) => res.json()),
};

const GameLobby = ({ onGameStart, userData, onLogout, onImageError }) => {
    // State to store the list of active events fetched from the server
    const [events, setEvents] = useState([]);
    // State to track if the data is being loaded
    const [isLoading, setIsLoading] = useState(true);

    // useEffect hook to fetch events when the component mounts
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                setIsLoading(true);
                // Fetch the list of active events from the new API endpoint
                const response = await api.get("/api/events");
                if (response.status === "success") {
                    setEvents(response.events);
                }
            } catch (error) {
                console.error("Failed to fetch events:", error);
                // Handle error, maybe show a message to the user
            } finally {
                setIsLoading(false);
            }
        };

        fetchEvents();
    }, []); // The empty dependency array ensures this runs only once

    // This function will be called when the user clicks any start button
    const handleStartGame = (eventId) => {
        // Call the onGameStart function passed from the parent component (App.js)
        // It will handle the actual API call to /api/start
        onGameStart(eventId);
    };

    if (isLoading) {
        return (
            <div className="w-full max-w-md mx-auto text-center p-6">
                <p className="text-white text-lg">Loading Events...</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md mx-auto bg-gray-800 bg-opacity-70 rounded-xl shadow-lg p-6 text-white animate-fade-in">
            {userData && (
                <div className="flex items-center gap-3 bg-white/10 p-2 rounded-lg mb-6">
                    <img
src={userData.photo_url ? `/api/avatar?url=${encodeURIComponent(userData.photo_url)}` : DefaultAvatar}                        alt="Profile"
                        className="w-12 h-12 rounded-full border-2 border-gray-500"
                        onError={onImageError}
                    />
                    <div className="flex-grow">
                        <h2 className="font-bold text-lg leading-tight">
                            {userData.first_name} {userData.last_name}
                        </h2>
                        <p className="text-sm opacity-80">
                            @{userData.username}
                        </p>
                    </div>
                    <button
                        onClick={onLogout}
                        className="ml-auto text-xs bg-red-500/50 px-3 py-1.5 rounded-md hover:bg-red-500/80 transition-colors"
                        title="Logout"
                    >
                        Logout
                    </button>
                </div>
            )}

            <h1 className="text-3xl font-bold mb-6 text-center text-yellow-400">
                Game Mode
            </h1>

            <div className="bg-gray-700 bg-opacity-50 rounded-lg p-4 my-3 transition-transform transform hover:scale-105">
                <h2 className="text-xl font-bold text-white">Free Play</h2>
                <p className="text-sm text-gray-300 mt-1 mb-3">
                    Practice and play just for fun.
                </p>
                <button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                    onClick={() => handleStartGame(null)} // eventId is null for free play
                >
                    Start
                </button>
            </div>

            {events.length > 0 && (
                <div className="relative flex py-3 items-center">
                    <div className="flex-grow border-t border-gray-600"></div>
                    <span className="flex-shrink mx-4 text-gray-400">
                        Events
                    </span>
                    <div className="flex-grow border-t border-gray-600"></div>
                </div>
            )}

            {events.map((event) => (
                <div
                    key={event.id}
                    className="bg-gray-700 bg-opacity-50 rounded-lg p-4 my-3 transition-transform transform hover:scale-105"
                >
                    <h2 className="text-xl font-bold text-yellow-400">
                        {event.name}
                    </h2>
                    <p className="text-sm text-gray-300 mt-1 mb-3">
                        {event.description}
                    </p>
                    <button
                        className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                        onClick={() => handleStartGame(event.id)}
                    >
                        Join Event
                    </button>
                </div>
            ))}
        </div>
    );
};

export default GameLobby;
