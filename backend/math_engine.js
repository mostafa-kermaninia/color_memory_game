// backend/math_engine.js

// --- Helper Function ---
// Generates a random integer within a specified range
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// --- Main Generate Function ---
// This is the only function exported. It generates a problem
// with difficulty algorithmically determined by the player's score.
function generate(score = 0) {
    
    // ## Step 1: Determine Difficulty Parameters based on Score ##
    
    // OPERATORS: Introduce new operators at score milestones.
    let available_ops = ['+', '-'];
    if (score >= 10) available_ops.push('×');
    if (score >= 25) available_ops.push('÷');
    const op = available_ops[randInt(0, available_ops.length - 1)];

    // OPERANDS: Numbers get larger as the score increases.
    let a, b, result;

    if (op === '×') {
        // For multiplication, numbers grow slower to keep it manageable.
        const max_operand = 7 + Math.floor(score / 5); // Max operand increases by 1 every 5 points.
        a = randInt(2, max_operand);
        b = randInt(2, Math.min(max_operand, 12)); // Keep one number smaller for easier mental calculation
        result = a * b;

    } else if (op === '÷') {
        // For division, we generate the answer first to ensure it's a whole number.
        const max_divisor = 5 + Math.floor(score / 8);
        b = randInt(2, max_divisor);
        result = randInt(2, max_divisor);
        a = b * result;

    } else { // '+' or '-'
        // For addition/subtraction, numbers grow much faster.
        const min_operand = 5 + score;
        const max_operand = 20 + Math.floor(score * 1.5);
        a = randInt(min_operand, max_operand);
        b = randInt(min_operand, max_operand);

        if (op === '-') {
            // Ensure the result is not negative by swapping numbers if needed.
            if (a < b) [a, b] = [b, a]; 
            result = a - b;
        } else {
            result = a + b;
        }
    }

    // ## Step 2: Decide if the presented answer should be correct or incorrect ##
    
    const is_correct = Math.random() > 0.4; // 60% chance of being correct
    let final_result;

    if (is_correct) {
        final_result = result;
    } else {
        // If incorrect, generate a "close" but wrong answer.
        // The potential error margin also grows slightly with the score.
        const error_margin = Math.floor(result / 10) + randInt(1, 5);
        const delta = randInt(1, Math.max(2, error_margin));
        final_result = result + (Math.random() < 0.5 ? -delta : delta);
        
        // Ensure the false result is never the same as the correct one.
        if (final_result === result) {
            final_result += 1;
        }
    }

    // ## Step 3: Return the parts of the problem (Solves the RTL issue permanently) ##

    const problem_parts = { a, op, b, result: final_result };
    return { problem: problem_parts, is_correct };
}

module.exports = { generate };