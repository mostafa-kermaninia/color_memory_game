import { motion } from "framer-motion";

export default function TimerBar({ total, left }) {
  // Calculate the width percentage based on time left
  const widthPercentage = (left / total) * 100;
  
  // Define the color stops for the gradient transition
  const colors = {
    green: "#10b981", // Green for high time
    yellow: "#f59e0b", // Yellow for medium time
    red: "#ef4444"      // Red for low time
  };

  // Determine the current color based on the time remaining
  const barColor = left > 2 * total / 3 ? colors.green : left > total / 3 ? colors.yellow : colors.red;

  return (
    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        initial={{ width: "100%" }}
        animate={{ 
          width: `${widthPercentage}%`,
          backgroundColor: barColor
        }}
        transition={{ 
          width: { duration: 0.5, ease: "linear" },
          backgroundColor: { duration: 0.5, ease: "easeInOut" }
        }}
      />
    </div>
  );
}