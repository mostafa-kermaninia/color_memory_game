import React from "react";
import { motion } from "framer-motion";

const padColors = {
    green: "bg-green-500",
    red: "bg-red-500",
    yellow: "bg-yellow-400",
    blue: "bg-blue-500",
};

const padVariants = {
    initial: { scale: 1, opacity: 0.7 },
    lit: {
        scale: [1, 1.1, 1],
        opacity: 1,
        boxShadow: "0px 0px 30px rgba(255, 255, 255, 0.7)",
        transition: { duration: 0.3 },
    },
    disabled: {
        opacity: 0.4,
        cursor: "not-allowed",
    },
};

export default function ColorPads({ onPadClick, litPad, playerTurn }) {
    return (
        <div className="grid grid-cols-2 gap-4 w-full max-w-xs aspect-square mx-auto">
            {Object.keys(padColors).map((color) => (
                <motion.div
                    key={color}
                    variants={padVariants}
                    animate={litPad === color ? "lit" : "initial"}
                    whileTap={playerTurn ? { scale: 0.95 } : {}}
                    onClick={() => playerTurn && onPadClick(color)}
                    className={`rounded-2xl cursor-pointer ${padColors[color]} ${
                        !playerTurn ? "pointer-events-none" : ""
                    }`}
                    style={{
                        filter: !playerTurn ? "brightness(0.6)" : "brightness(1)",
                    }}
                />
            ))}
        </div>
    );
}