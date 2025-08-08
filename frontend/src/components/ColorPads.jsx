// frontend/src/components/ColorPads.jsx

import React, { useRef, useEffect } from 'react';

// تعریف رنگ‌ها در حالت عادی و روشن
const padColors = {
    green:  { normal: '#22c55e', lit: '#4ade80' },
    red:    { normal: '#ef4444', lit: '#f87171' },
    yellow: { normal: '#facc15', lit: '#fde047' },
    blue:   { normal: '#3b82f6', lit: '#60a5fa' },
};

// تعریف موقعیت و اندازه پدها روی بوم
const padLayout = {
    green:  { x: 0,   y: 0 },
    red:    { x: 1,   y: 0 },
    yellow: { x: 0,   y: 1 },
    blue:   { x: 1,   y: 1 },
};

export default function ColorPads({ onPadClick, litPad, playerTurn }) {
    const canvasRef = useRef(null);
    const canvasSize = 300; // اندازه بوم نقاشی (پیکسل)
    const gap = 16;        // فاصله بین پدها
    const padSize = (canvasSize - gap) / 2;

    // این useEffect مسئول نقاشی کردن وضعیت فعلی بازی روی بوم است
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // پاک کردن بوم قبل از هر نقاشی مجدد
        ctx.clearRect(0, 0, canvasSize, canvasSize);

        // اعمال فیلتر تاریکی اگر نوبت بازیکن نباشد
        ctx.filter = playerTurn ? 'brightness(1)' : 'brightness(0.6)';

        // پیمایش روی هر رنگ و نقاشی کردن آن
        for (const color in padLayout) {
            const layout = padLayout[color];
            const colors = padColors[color];
            
            // تعیین رنگ بر اساس اینکه پد روشن است یا نه
            ctx.fillStyle = (litPad === color) ? colors.lit : colors.normal;

            const x = layout.x * (padSize + gap);
            const y = layout.y * (padSize + gap);
            
            // نقاشی یک مستطیل با گوشه‌های گرد
            ctx.beginPath();
            ctx.roundRect(x, y, padSize, padSize, [24]); // شعاع گردی گوشه: 24
            ctx.fill();

            // اضافه کردن افکت درخشش اگر پد روشن باشد
            if (litPad === color) {
                ctx.shadowColor = 'rgba(255, 255, 255, 0.7)';
                ctx.shadowBlur = 30;
                ctx.fill(); // دوباره نقاشی می‌کنیم تا درخشش اعمال شود
                ctx.shadowBlur = 0; // ریست کردن سایه برای پد بعدی
            }
        }
        
        // ریست کردن فیلتر در انتها
        ctx.filter = 'none';

    }, [litPad, playerTurn, padSize]); // این افکت با تغییر پد روشن یا نوبت بازیکن دوباره اجرا می‌شود

    // این تابع مسئول مدیریت کلیک روی بوم است
    const handleCanvasClick = (event) => {
        if (!playerTurn) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        
        // محاسبه مختصات کلیک نسبت به بوم
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // بررسی اینکه کلیک روی کدام پد بوده است
        for (const color in padLayout) {
            const layout = padLayout[color];
            const padX = layout.x * (padSize + gap);
            const padY = layout.y * (padSize + gap);

            if (x >= padX && x <= padX + padSize && y >= padY && y <= padY + padSize) {
                onPadClick(color); // اجرای تابع پاس داده شده از App.js
                break; // پس از پیدا کردن پد، از حلقه خارج می‌شویم
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
            style={{ cursor: playerTurn ? 'pointer' : 'not-allowed' }}
        />
    );
}