/**
 * دو دکمهٔ «درست / نادرست»
 * @param {{ onAnswer: (answer: boolean)=>void, disabled: boolean }} props
 */
export default function AnswerButtons({ onAnswer, disabled }) {
    const base =
      "w-32 h-14 rounded-2xl text-xl font-semibold shadow-lg transition-transform active:scale-95";
  
    return (
      <div className="flex gap-8 mt-8 justify-center">
        <button
          className={`${base} bg-green-500 hover:bg-green-600 text-white`}
          onClick={() => onAnswer(true)}
          disabled={disabled}
        >
          True
        </button>
  
        <button
          className={`${base} bg-red-500 hover:bg-red-600 text-white`}
          onClick={() => onAnswer(false)}
          disabled={disabled}
        >
          False
        </button>
      </div>
    );
  }
  