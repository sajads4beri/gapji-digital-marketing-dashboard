/**
 * Safe Formula Evaluator (بدون استفاده از eval یا new Function)
 * Source: Product Document p. 13 §11 (فرمول‌ساز شاخص‌های اختصاصی)
 * 
 * Supports:
 * - Variables: cost, lead, customer, revenue, clicks, impressions, conversions, budget
 *   (Also supports Persian equivalents: هزینه, لید, مشتری, درآمد, کلیک, نمایش, تبدیل, بودجه)
 * - Operators: +, -, *, /
 * - Parentheses: (, )
 * - Floating point and integer constants: 100, 0.5, etc.
 * - Handles division by zero gracefully (returns 0 without crashing)
 * - Returns clear, informative Persian syntax and variable error messages
 */

export const ALLOWED_VARIABLES: Record<string, string> = {
  // English canonical
  cost: 'cost',
  lead: 'lead',
  leads: 'lead',
  customer: 'customer',
  customers: 'customer',
  revenue: 'revenue',
  clicks: 'clicks',
  click: 'clicks',
  impressions: 'impressions',
  impression: 'impressions',
  conversions: 'conversions',
  conversion: 'conversions',
  budget: 'budget',

  // Persian aliases
  هزینه: 'cost',
  لید: 'lead',
  لیدها: 'lead',
  مشتری: 'customer',
  مشتریان: 'customer',
  درآمد: 'revenue',
  فروش: 'revenue',
  کلیک: 'clicks',
  کلیک‌ها: 'clicks',
  کلیکها: 'clicks',
  نمایش: 'impressions',
  ایمپرشن: 'impressions',
  تبدیل: 'conversions',
  تبدیل‌ها: 'conversions',
  تبدیلها: 'conversions',
  کانورژن: 'conversions',
  بودجه: 'budget',
};

export const CANONICAL_VARIABLE_LABELS: Record<string, string> = {
  cost: 'هزینه (cost)',
  lead: 'لید (lead)',
  customer: 'مشتری (customer)',
  revenue: 'درآمد (revenue)',
  clicks: 'کلیک (clicks)',
  impressions: 'نمایش (impressions)',
  conversions: 'تبدیل (conversions)',
  budget: 'بودجه (budget)',
};

type TokenType = 'NUMBER' | 'VARIABLE' | 'PLUS' | 'MINUS' | 'MULTIPLY' | 'DIVIDE' | 'LPAREN' | 'RPAREN' | 'EOF';

interface Token {
  type: TokenType;
  value: string;
  pos: number;
}

export interface FormulaValidationResult {
  isValid: boolean;
  error?: string;
  variables: string[];
  normalizedFormula?: string;
}

export interface EvaluationResult {
  value: number;
  divisionByZero: boolean;
  variablesUsed: string[];
}

export class SafeFormulaEvaluator {
  /**
   * Tokenize input formula into structured tokens
   */
  private static tokenize(formula: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;
    const len = formula.length;

    while (i < len) {
      const ch = formula[i];

      // Skip whitespace
      if (/\s/.test(ch)) {
        i++;
        continue;
      }

      // Operators and Parentheses
      if (ch === '+') {
        tokens.push({ type: 'PLUS', value: '+', pos: i });
        i++;
      } else if (ch === '-') {
        tokens.push({ type: 'MINUS', value: '-', pos: i });
        i++;
      } else if (ch === '*') {
        tokens.push({ type: 'MULTIPLY', value: '*', pos: i });
        i++;
      } else if (ch === '/') {
        tokens.push({ type: 'DIVIDE', value: '/', pos: i });
        i++;
      } else if (ch === '(') {
        tokens.push({ type: 'LPAREN', value: '(', pos: i });
        i++;
      } else if (ch === ')') {
        tokens.push({ type: 'RPAREN', value: ')', pos: i });
        i++;
      } else if (/[0-9.]/.test(ch)) {
        // Numbers (integers or decimals)
        const start = i;
        let hasDot = ch === '.';
        i++;
        while (i < len && /[0-9.]/.test(formula[i])) {
          if (formula[i] === '.') {
            if (hasDot) {
              throw new Error(`عدد نامعتبر با چند ممیز در موقعیت ${i + 1}`);
            }
            hasDot = true;
          }
          i++;
        }
        tokens.push({ type: 'NUMBER', value: formula.substring(start, i), pos: start });
      } else if (/[a-zA-Z_\u0600-\u06FF]/.test(ch)) {
        // Variable / Identifier (English letters, Persian letters, underscores)
        const start = i;
        i++;
        while (i < len && /[a-zA-Z0-9_\u0600-\u06FF]/.test(formula[i])) {
          i++;
        }
        const rawIdent = formula.substring(start, i);
        const lowerIdent = rawIdent.toLowerCase();
        const canonical = ALLOWED_VARIABLES[lowerIdent];

        if (!canonical) {
          const allowedList = Object.keys(CANONICAL_VARIABLE_LABELS)
            .map((k) => CANONICAL_VARIABLE_LABELS[k])
            .join('، ');
          throw new Error(
            `متغیر ناشناخته «${rawIdent}». متغیرهای مجاز عبارتند از: ${allowedList}`,
          );
        }

        tokens.push({ type: 'VARIABLE', value: canonical, pos: start });
      } else {
        throw new Error(`کاراکتر غیرمجاز «${ch}» در موقعیت ${i + 1}`);
      }
    }

    tokens.push({ type: 'EOF', value: '', pos: len });
    return tokens;
  }

  /**
   * Recursive descent parser for grammar:
   * Expression := Term (('+' | '-') Term)*
   * Term       := Factor (('*' | '/') Factor)*
   * Factor     := ('+' | '-')? Primary
   * Primary    := NUMBER | VARIABLE | '(' Expression ')'
   */
  private static parseAndEval(
    tokens: Token[],
    variables: Record<string, number>,
    isValidateOnly: boolean,
  ): { value: number; divisionByZero: boolean; usedVars: Set<string> } {
    let index = 0;
    let divisionByZero = false;
    const usedVars = new Set<string>();

    function peek(): Token {
      return tokens[index];
    }

    function consume(expectedType?: TokenType, expectedVal?: string): Token {
      const current = tokens[index];
      if (expectedType && current.type !== expectedType) {
        throw new Error(
          `انتظار ${expectedVal || expectedType} در موقعیت ${current.pos + 1} می‌رفت، اما «${current.value || 'پایان عبارت'}» یافت شد.`,
        );
      }
      index++;
      return current;
    }

    function parsePrimary(): number {
      const token = peek();

      if (token.type === 'NUMBER') {
        consume('NUMBER');
        return parseFloat(token.value);
      }

      if (token.type === 'VARIABLE') {
        consume('VARIABLE');
        usedVars.add(token.value);
        if (isValidateOnly) return 1;
        const val = variables[token.value];
        return typeof val === 'number' && !isNaN(val) ? val : 0;
      }

      if (token.type === 'LPAREN') {
        consume('LPAREN');
        const exprVal = parseExpression();
        if (peek().type !== 'RPAREN') {
          throw new Error('پرانتز باز بسته نشده است.');
        }
        consume('RPAREN');
        return exprVal;
      }

      if (token.type === 'EOF') {
        throw new Error('فرمول به طور ناگهانی پایان یافته است (عملوند ناقص).');
      }

      throw new Error(`عبارت یا متغیر معتبر در موقعیت ${token.pos + 1} یافت نشد (یافت شد: «${token.value}»).`);
    }

    function parseFactor(): number {
      const token = peek();
      if (token.type === 'PLUS') {
        consume('PLUS');
        return parsePrimary();
      }
      if (token.type === 'MINUS') {
        consume('MINUS');
        return -parsePrimary();
      }
      return parsePrimary();
    }

    function parseTerm(): number {
      let left = parseFactor();

      while (peek().type === 'MULTIPLY' || peek().type === 'DIVIDE') {
        const op = consume();
        const right = parseFactor();
        if (op.type === 'MULTIPLY') {
          left = left * right;
        } else {
          if (right === 0) {
            divisionByZero = true;
            left = 0; // Safe fallback for division by zero
          } else {
            left = left / right;
          }
        }
      }

      return left;
    }

    function parseExpression(): number {
      let left = parseTerm();

      while (peek().type === 'PLUS' || peek().type === 'MINUS') {
        const op = consume();
        const right = parseTerm();
        if (op.type === 'PLUS') {
          left = left + right;
        } else {
          left = left - right;
        }
      }

      return left;
    }

    const result = parseExpression();

    if (peek().type !== 'EOF') {
      const extra = peek();
      if (extra.type === 'RPAREN') {
        throw new Error(`پرانتز بسته اضافه در موقعیت ${extra.pos + 1}.`);
      }
      throw new Error(`عملگر یا کاراکتر غیرمنتظره «${extra.value}» در موقعیت ${extra.pos + 1}.`);
    }

    return {
      value: isNaN(result) || !isFinite(result) ? 0 : result,
      divisionByZero,
      usedVars,
    };
  }

  /**
   * Validate formula syntax and check variables
   */
  public static validate(formula: string): FormulaValidationResult {
    if (!formula || !formula.trim()) {
      return {
        isValid: false,
        error: 'فرمول نمی‌تواند خالی باشد.',
        variables: [],
      };
    }

    try {
      const tokens = this.tokenize(formula);
      if (tokens.length <= 1) {
        return {
          isValid: false,
          error: 'فرمول نمی‌تواند خالی باشد.',
          variables: [],
        };
      }

      const { usedVars } = this.parseAndEval(tokens, {}, true);

      // Reconstruct normalized formula string
      const normalizedFormula = tokens
        .filter((t) => t.type !== 'EOF')
        .map((t) => t.value)
        .join(' ')
        .replace(/\s*\(\s*/g, ' ( ')
        .replace(/\s*\)\s*/g, ' ) ')
        .replace(/\s+/g, ' ')
        .trim();

      return {
        isValid: true,
        variables: Array.from(usedVars),
        normalizedFormula,
      };
    } catch (err: any) {
      return {
        isValid: false,
        error: err.message || 'فرمول وارد شده نامعتبر است.',
        variables: [],
      };
    }
  }

  /**
   * Evaluate formula using provided campaign or context variables
   */
  public static evaluate(
    formula: string,
    context: Record<string, number> = {},
  ): EvaluationResult {
    const tokens = this.tokenize(formula);
    const { value, divisionByZero, usedVars } = this.parseAndEval(tokens, context, false);

    // Round to 4 decimal places for clean reporting
    const rounded = Math.round(value * 10000) / 10000;

    return {
      value: rounded,
      divisionByZero,
      variablesUsed: Array.from(usedVars),
    };
  }
}
