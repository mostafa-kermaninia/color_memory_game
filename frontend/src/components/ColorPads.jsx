import React, { useRef, useEffect } from "react";

// تعریف رنگ‌ها در حالت عادی و روشن (بدون تغییر)
const padColors = {
    green: { normal: "#22c55e", lit: "#4ade80" },
    red: { normal: "#ef4444", lit: "#f87171" },
    yellow: { normal: "#facc15", lit: "#fde047" },
    blue: { normal: "#3b82f6", lit: "#60a5fa" },
};

// تعریف موقعیت پدها (بدون تغییر)
const padLayout = {
    green: { x: 0, y: 0 },
    red: { x: 1, y: 0 },
    yellow: { x: 0, y: 1 },
    blue: { x: 1, y: 1 },
};

export default function ColorPads({ onPadClick, litPad, playerTurn }) {
    const canvasRef = useRef(null);

    // --- شروع تغییرات ---

    // اندازه اصلی شبکه پدها (بدون حاشیه)
    const baseSize = 300;
    // ایجاد یک حاشیه ۳۰ پیکسلی در اطراف برای نمایش کامل سایه
    const padding = 30;
    // فاصله بین پدها
    const gap = 16;

    // اندازه نهایی بوم نقاشی = اندازه شبکه + حاشیه از دو طرف
    const canvasSize = baseSize + padding * 2;
    // اندازه هر پد رنگی
    const padSize = (baseSize - gap) / 2;

    // --- پایان تغییرات ---

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvasSize, canvasSize);
        ctx.filter = playerTurn ? "brightness(1)" : "brightness(0.6)";

        for (const color in padLayout) {
            const layout = padLayout[color];
            const colors = padColors[color];

            ctx.fillStyle = litPad === color ? colors.lit : colors.normal;

            // مختصات x و y با در نظر گرفتن حاشیه محاسبه می‌شود
            const x = padding + layout.x * (padSize + gap);
            const y = padding + layout.y * (padSize + gap);

            ctx.beginPath();
            ctx.roundRect(x, y, padSize, padSize, [24]);
            ctx.fill();

            if (litPad === color) {
                // حالا سایه فضای کافی برای نمایش دارد
                ctx.shadowColor = "rgba(255, 255, 255, 0.7)";
                ctx.shadowBlur = 30;
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }

        ctx.filter = "none";
    }, [litPad, playerTurn, padSize, canvasSize, padding, gap]); // افزودن متغیرهای جدید به لیست وابستگی‌ها

    const handleCanvasClick = (event) => {
        if (!playerTurn) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();

        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        for (const color in padLayout) {
            const layout = padLayout[color];

            // موقعیت پدها برای تشخیص کلیک نیز با در نظر گرفتن حاشیه محاسبه می‌شود
            const padX = padding + layout.x * (padSize + gap);
            const padY = padding + layout.y * (padSize + gap);

            if (
                x >= padX &&
                x <= padX + padSize &&
                y >= padY &&
                y <= padY + padSize
            ) {
                onPadClick(color);
                break;
            }
        }
    };

    return (
        <canvas
            ref={canvasRef}
            width={canvasSize}
            height={canvasSize}
            onClick={handleCanvasClick}
            className="mx-auto"
            style={{ cursor: playerTurn ? "pointer" : "not-allowed" }}
        />
    );
}
