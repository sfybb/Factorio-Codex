import Quantity from "./Quantity";

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
    ["^%-?%d+%.?%d*", 'NUMBER'],
    ["^[a-zA-Z]+", 'IDENT'],
    ['^"[^"]+"', 'STRING'],
    ["^%+", '+'],
    ["^-", '-'],
    ["^%*", '*'],
    ["^%^", '^'],
    ["^%/", '/'],
    ["^%(", '('],
    ["^%)", ')'],
    ["^,", ','],
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
    lookahead: ParsedToken | undefined;

    constructor(tokenizer?: Tokenizer) {
        this.tokenizer = tokenizer ?? new Tokenizer(tokens);
    }

    read(string: string): AST {
        this.tokenizer.read(string);
        this.lookahead = this.tokenizer.next();
        return this.EXPRESSION();
    }

    eat(...tokenTypes: TokenType[]): ParsedToken {
        const token = this.lookahead;

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

        this.lookahead = this.tokenizer.next();

        return token;
    }

    is(...tokenTypes: TokenType[]): boolean {
        return tokenTypes.includes(this.lookahead?.type);
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
        const maybeCallee = this.MULTIPLICATION();

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

        return maybeCallee;
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

        while (this.is('^')) {
            left = {
                type: 'binary',
                left,
                op: this.eat('^').type ?? "^",
                right: this.BASIC(),
            };
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

        if (this.is('NUMBER')) {
            return { type: 'number', value: this.eat('NUMBER').token };
        }

        if (this.is('IDENT')) {
            return { type: 'ident', value: this.eat('IDENT').token };
        }

        throw new Error(`Malformed expression. Expected '(', 'NUMBER', 'IDENT' got '${this.lookahead}'`);
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
    // remove spaces
    [expression, ] = string.gsub(expression, "%s+", "");

    // remove trailing operators or parenthesis
    [expression, ] = string.gsub(expression, "[%+%-%*%/%%%^%(%)]*$", "");

    const [, open_parens] = string.gsub(expression, "%(", "")
    const [, close_parens] = string.gsub(expression, "%)", "")

    if (open_parens > close_parens) {
        expression += ")".repeat(open_parens - close_parens)
    } else if (open_parens < close_parens) {
        expression = "(".repeat(close_parens - open_parens) + expression
    }

    return expression
}

export function evaluateExpression(expression: string): Quantity {
    let p = new Parser()

    expression = cleanExpression(expression)

    $log_debug!(`Parsing cleaned expression "${expression}"`)
    let ast: AST = p.read(expression)

    $log_debug!(`Generated AST ${serpent.block(ast)}`)

    return evaluateAST(ast)
}