import Quantity from "./Quantity";
import SI from "./SI_units"

const functions: { [key: string]: (...args: Quantity[]) => Quantity } = {
    sin: (x: Quantity) => Quantity.fromNumber(Math.sin(x.getValue())),
    cos: (x: Quantity) => Quantity.fromNumber(Math.cos(x.getValue())),
    tan: (x: Quantity) => Quantity.fromNumber(Math.tan(x.getValue())),
    sqrt: (x: Quantity) => Quantity.fromNumber(Math.sqrt(x.getValue())),
    log: (x: Quantity, base?: Quantity) => Quantity.fromNumber(Math.log(x.getValue()) / (base != undefined ? Math.log(base.getValue()) : 1)),
    abs: (x: Quantity) => x.significand < 0 ? x.mul(Quantity.fromNumber(-1)) : x,
}

const math_constants: { [key: string]: number } = {
    pi: Math.PI,
    Pi: Math.PI,
    PI: Math.PI,
}

type AST = { type: 'number' | 'ident', value: string } | { type: "call", fn: string, args: AST[]}
    | { type: "binary", op: string, left: AST, right: AST }

type TokenType = string | undefined | null;
type ParsedToken = {token: string, type: TokenType}
type Token = [string, TokenType];

const tokens: Token[] =  [
    ["^%+", '+'],
    ["^-", '-'],
    ["^%*", '*'],
    ["^%^", '^'],
    ["^%/", '/'],
    ["^%(", '('],
    ["^%)", ')'],
    ["^,", ','],
    ["^%d+%.?%d*", 'NUMBER'],
    ["^[a-zA-Z]+", 'IDENT'],
    ['^"[^"]+"', 'STRING'],
]

class Tokenizer {
    // List of tokens recognized by the tokenizer
    tokens: Token[];

    // Position in the input string from which it will
    // read to get the next token
    cursor: number;

    // String to turn into tokens
    string: string;

    constructor(tokens: Token[]) {
        this.tokens = tokens;
        this.cursor = 0;
        this.string = "";
    }

    read(string: string) {
        this.cursor = 0;
        // remove spaces
        this.string = string.replaceAll("\s+", "");
    }

    next(): ParsedToken | undefined {
        // If at end of input, not more tokens to generate
        if (this.cursor === this.string.length) {
            return undefined;
        }

        // Find substring beginning at position of cursor
        const str = this.string.slice(this.cursor);

        for (const [pattern, type] of this.tokens) {
            let [match] = string.match(str, pattern) ?? [];

            if (!match) {
                continue;
            }

            this.cursor += match.length;

            // Skip tokens with null types
            if (type === null) {
                return this.next();
            }

            return { token: match, type: type };
        }

        // Could not extract any tokens, so throw error
        throw new Error(`Unrecognized input: ${str[0]}`);
    }
}

class Parser {
    tokenizer: Tokenizer;
    lookahead: (ParsedToken | undefined)[];

    constructor(tokenizer?: Tokenizer) {
        this.tokenizer = tokenizer ?? new Tokenizer(tokens);
        this.lookahead = []
    }

    read(string: string): AST {
        this.tokenizer.read(string);
        this.lookahead = [this.tokenizer.next(), this.tokenizer.next()];
        return this.EXPRESSION();
    }

    eat(...tokenTypes: TokenType[]): ParsedToken {
        const token = this.lookahead.shift();

        if (token == undefined) {
            throw new Error(
                `Unexpected end of input; expected ${tokenTypes.join(", ")}`
            );
        }

        if (!tokenTypes.includes(token.type)) {
            throw new Error(
                `Expected ${tokenTypes.join(", ")} === ${token.type}`
            );
        }

        this.lookahead.push(this.tokenizer.next());

        return token;
    }

    is(...tokenTypes: TokenType[]): boolean {
        return tokenTypes.includes(this.lookahead[0]?.type);
    }

    next_is(...tokenTypes: TokenType[]): boolean {
        let type = this.lookahead.length > 1 ? this.lookahead[1]?.type : undefined
        return  tokenTypes.includes(type);
    }

    EXPRESSION(): AST {
        return this.ADDITION();
    }

    ADDITION(): AST {
        let left = this.CALL();

        while (this.is('+', '-')) {
            left = {
                type: 'binary',
                left,
                op: this.eat('+', '-').type ?? "+",
                right: this.CALL(),
            };
        }

        return left;
    }

    CALL(): AST {
        /*const maybeCallee = this.MULTIPLICATION();

        if (this.is('NUMBER', 'IDENT') && maybeCallee.type == "number" || maybeCallee.type == "ident") {
            return {
                type: 'call',
                fn: maybeCallee.value,
                args: [this.CALL()],
            };
        }

        if (this.is('(')) {
            this.eat('(');
            const args = [this.EXPRESSION()];

            while (this.is(',')) {
                this.eat(',');
                args.push(this.EXPRESSION());
            }

            this.eat(')');
            // @ts-ignore
            return { type: 'call', fn: maybeCallee.value, args };
        }

        return maybeCallee;*/
        // Start with the primary expression parsed by MULTIPLICATION.
        let callee = this.MULTIPLICATION();

        // Only interpret as a function call if an explicit '(' follows.
        while (this.is('(')) {
            this.eat('(');
            const args: AST[] = [];
            // If there's something inside the parentheses, parse it.
            if (!this.is(')')) {
                args.push(this.EXPRESSION());
                while (this.is(',')) {
                    this.eat(',');
                    args.push(this.EXPRESSION());
                }
            }
            this.eat(')');
            // Ensure that the callee is a valid identifier for a function call.
            if (callee.type !== 'ident') {
                throw new Error(`Cannot call non-function value.`);
            }
            callee = { type: 'call', fn: callee.value, args };
        }

        return callee;
    }

    MULTIPLICATION(): AST {
        let left = this.IMPLICITOPERATIONS();

        while (this.is('*', '/')) {
            left = {
                type: 'binary',
                left,
                op: this.eat('*', '/').type ?? "*",
                right: this.IMPLICITOPERATIONS(),
            };
        }

        return left;
    }

    IMPLICITOPERATIONS(): AST {
        let left = this.EXPONENTIATION();

        while (this.is('(', 'NUMBER', 'IDENT')) {
            // If the current token is a '-' and the following token is a NUMBER,
            // assume it's a unary minus (handled in BASIC) rather than implicit multiplication.
            if (this.is('NUMBER') && (this.lookahead[0]?.token ?? "").startsWith("-")) break;

            left = {
                type: 'binary',
                left,
                op: 'implicit',
                right: this.EXPONENTIATION(),
            };
        }

        return left;
    }

    EXPONENTIATION(): AST {
        let left = this.BASIC();

        let cur = left
        while (this.is('^')) {
            if (cur.type != "binary" || cur.op != "^") {
                left = {
                    type: 'binary',
                    left: cur,
                    op: this.eat('^').type ?? "^",
                    right: this.BASIC(),
                };
                cur = left
            } else {
                cur.right = {
                    type: 'binary',
                    left: cur.right,
                    op: this.eat('^').type ?? "^",
                    right: this.BASIC(),
                }
                cur = cur.right
            }
        }

        return left;
    }

    BASIC(): AST {
        if (this.is('(')) {
            this.eat('(');
            const expr = this.EXPRESSION();
            this.eat(')');

            return expr;
        }

        if (this.is('NUMBER') || (this.is('-') && this.next_is('NUMBER'))) {
            let prefix = ""
            if (this.is('-')) prefix = this.eat('-').token

            return { type: 'number', value: prefix + this.eat('NUMBER').token };
        }

        if (this.is('IDENT')) {
            return { type: 'ident', value: this.eat('IDENT').token };
        }

        throw new Error(`Malformed expression. Expected '(', 'NUMBER', 'IDENT' got '${serpent.line(this.lookahead)}'`);
    }
}

function evaluateAST(node: AST): Quantity {
    const binaryEval = (op: string, left: Quantity, right: Quantity): Quantity => {
        switch (op) {
            case '+': return left.add(right)
            case '-': return left.sub(right)
            case 'implicit':
            case '*': return left.mul(right)
            case '/': return left.div(right)
            case '^': return left.pow(right)
        }
        throw new Error(`Unknown operator "${op}"`);
    }

    switch (node.type) {
        case "binary":
            const left = evaluateAST(node.left);
            const right = evaluateAST(node.right);
            return binaryEval(node.op, left, right);
        case "call":
            const fn = functions[node.fn]
            if (fn == undefined) throw new Error(`Unknown function "${node.fn}"`);
            const args = node.args.map(arg => evaluateAST(arg));
            return fn(...args)
        case 'ident':
            return Quantity.fromUnit(node.value)
        case 'number':
            let val = tonumber(node.value)
            if (val == undefined) throw new Error(`Expected number but got "${node.value}"`);
            return Quantity.fromNumber(val)
    }
}

function cleanExpression(expression: string): string {
    // remove underscores; FIXME: keep spaces (important for clarity "km sin(PI)" != "kmsin(PI)")
    [expression, ] = string.gsub(expression, "[%s_]+", "");

    // remove trailing operators, parenthesis or spaces
    [expression, ] = string.gsub(expression, "[%+%-%*%/%%%^%(%)%s]*$", "");

    const [, open_parens] = string.gsub(expression, "%(", "")
    const [, close_parens] = string.gsub(expression, "%)", "")

    if (open_parens > close_parens) {
        expression += ")".repeat(open_parens - close_parens)
    } else if (open_parens < close_parens) {
        expression = "(".repeat(close_parens - open_parens) + expression
    }

    let superscript_map: {[key: string]: number} = SI.superscript_num.reduce((prev, cur, idx) => ({...prev, [cur]: idx}), {})

    for (let [[match]] of string.gmatch(expression, `[${SI.superscript_num.join("")}]+`)) {
        let new_val = "^"
        for (let c of match) {
            new_val += superscript_map[c]
        }

        [expression, ] = string.gsub(expression, match, new_val)
    }

    return expression
}

function getASTExpr(ast: AST): string {
    switch (ast.type) {
        case "binary": return `(${getASTExpr(ast.left)} ${ast.op == "implicit" ? "<*>" : ast.op} ${getASTExpr(ast.right)})`
        case "call": return `${ast.fn}(${ast.args.map(arg => getASTExpr(arg)).join(", ")})`
        case "ident":
        case "number":
            return ast.value
    }
}

export function evaluateExpression(expression: string): Quantity {
    let p = new Parser()

    expression = cleanExpression(expression)

    $log_debug!(`Parsing cleaned expression "${expression}"`)
    let ast: AST = p.read(expression)

    $log_debug!(`Generated AST "${getASTExpr(ast)}": \n${serpent.block(ast)}`)

    return evaluateAST(ast)
}