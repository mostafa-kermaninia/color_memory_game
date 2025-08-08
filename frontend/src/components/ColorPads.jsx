import React, { useRef, useEffect, useState, useLayoutEffect } from "react";

// تعریف رنگ‌ها و موقعیت‌ها (بدون تغییر)
const padColors = {
    green: { normal: "#22c55e", lit: "#4ade80" },
    red: { normal: "#ef4444", lit: "#f87171" },
    yellow: { normal: "#facc15", lit: "#fde047" },
    blue: { normal: "#3b82f6", lit: "#60a5fa" },
};

const padLayout = {
    green: { x: 0, y: 0 },
    red: { x: 1, y: 0 },
    yellow: { x: 0, y: 1 },
    blue: { x: 1, y: 1 },
};

export default function ColorPads({ onPadClick, litPad, playerTurn }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null); // رفرنس به div والد
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    // این افکت مسئول بروزرسانی ابعاد canvas بر اساس اندازه والد است
    useLayoutEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                // عرض والد را به عنوان اندازه اصلی در نظر می‌گیریم
                const size = containerRef.current.clientWidth;
                setDimensions({ width: size, height: size });
            }
        };

        updateDimensions(); // در اولین رندر اجرا می‌شود

        // یک observer برای گوش دادن به تغییرات اندازه والد ایجاد می‌کنیم
        const resizeObserver = new ResizeObserver(updateDimensions);
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        // در زمان unmount شدن کامپوننت، observer را پاک می‌کنیم
        return () => resizeObserver.disconnect();
    }, []);

    // مقادیر جدید بر اساس ابعاد داینامیک محاسبه می‌شوند
    const { width: canvasSize } = dimensions;
    const padding = canvasSize * 0.08; // حاشیه به صورت درصدی از کل اندازه
    const baseSize = canvasSize - padding * 2;
    const gap = baseSize * 0.05; // فاصله بین پدها به صورت درصدی
    const padSize = (baseSize - gap) / 2;

    // این افکت مسئول نقاشی کردن روی بوم است
    useEffect(() => {
        if (dimensions.width === 0) return; // اگر هنوز ابعاد محاسبه نشده، نقاشی نکن

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        ctx.clearRect(0, 0, canvasSize, canvasSize);
        ctx.filter = playerTurn ? "brightness(1)" : "brightness(0.6)";

        for (const color in padLayout) {
            const layout = padLayout[color];
            const colors = padColors[color];
            ctx.fillStyle = litPad === color ? colors.lit : colors.normal;

            const x = padding + layout.x * (padSize + gap);
            const y = padding + layout.y * (padSize + gap);

            ctx.beginPath();
            // شعاع گردی گوشه‌ها را نیز داینامیک می‌کنیم
            ctx.roundRect(x, y, padSize, padSize, [padSize * 0.15]);
            ctx.fill();

            if (litPad === color) {
                ctx.shadowColor = "rgba(255, 255, 255, 0.7)";
                ctx.shadowBlur = padSize * 0.2; // سایه هم داینامیک می‌شود
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }
        ctx.filter = "none";
    }, [litPad, playerTurn, dimensions, padSize, padding, gap, canvasSize]);

    const handleCanvasClick = (event) => {
        if (!playerTurn || dimensions.width === 0) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();

        // محاسبه نسبت مقیاس، در صورتی که اندازه واقعی canvas با اندازه نمایشی آن فرق کند
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;

        for (const color in padLayout) {
            const layout = padLayout[color];
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
        // از یک div به عنوان والد برای تعیین اندازه استفاده می‌کنیم
        <div
            ref={containerRef}
            className="w-full max-w-xs aspect-square mx-auto"
        >
            <canvas
                ref={canvasRef}
                width={dimensions.width}
                height={dimensions.height}
                onClick={handleCanvasClick}
                style={{
                    cursor: playerTurn ? "pointer" : "not-allowed",
                    touchAction: "none",
                }}
            />
        </div>
    );
}
