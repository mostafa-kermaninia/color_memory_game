import { motion } from "framer-motion";

/**
 * The card that displays the math problem.
 * @param {{ text: {a: number, op: string, b: number, result: number} }} props
 */
export default function ProblemCard({ text }) {
  // If `text` is not an object, it might be from an old session. Handle gracefully.
  if (!text || typeof text !== 'object') {
    return (
      <motion.div className="mx-auto mt-6 p-6 ...">
        Loading...
      </motion.div>
    );
  }

  const { a, op, b, result } = text;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="mx-auto mt-6 p-6 bg-white/80 backdrop-blur rounded-2xl shadow-xl text-4xl font-bold text-center text-slate-800"
    >
      {/* We use a flex container to physically arrange the elements from left to right. */}
      {/* This method is immune to text-directionality issues (RTL/LTR). */}
      <div className="flex justify-center items-center gap-x-3 sm:gap-x-4 font-mono">
        <span>{a}</span>
        <span className="text-gray-500">{op}</span>
        <span>{b}</span>
        <span className="text-gray-500">=</span>
        <span>{result}</span>
      </div>
    </motion.div>
  );
}