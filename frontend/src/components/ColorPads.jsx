import React from "react";
import { motion } from "framer-motion";

const padColors = {
    green: "bg-green-500",
    red: "bg-red-500",
    yellow: "bg-yellow-400",
    blue: "bg-blue-500",
};

const padVariants = {
    initial: { scale: 1, opacity: 0.8, filter: "brightness(0.8)" },
    lit: {
        scale: [1, 1.05, 1], // انیمیشن ضربان‌دار
        opacity: 1,
        filter: "brightness(1.5)",
        boxShadow: "0px 0px 25px currentColor",
        transition: { duration: 0.3, ease: "easeInOut" },
    },
};

export default function ColorPads({ onPadClick, litPad, playerTurn }) {
    return (
        <div className="grid grid-cols-2 gap-5 w-full max-w-xs aspect-square mx-auto">
            {Object.keys(padColors).map((color) => (
                <motion.div
                    key={color}
                    variants={padVariants}
                    animate={litPad === color ? "lit" : "initial"}
                    whileTap={playerTurn ? { scale: 0.95, filter: "brightness(1.2)" } : {}}
                    onClick={() => playerTurn && onPadClick(color)}
                    className={`rounded-3xl cursor-pointer ${padColors[color]} ${
                        !playerTurn ? "pointer-events-none" : ""
                    }`}
                    style={{
                        transition: "filter 0.2s",
                    }}
                />
            ))}
        </div>
    );
}