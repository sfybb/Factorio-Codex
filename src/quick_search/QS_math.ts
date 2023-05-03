

// Math calculator adapted from https://gist.github.com/Noble-Mushtak/a2eb302003891c85b562
namespace QSMath {
    function getNumber(str: string): LuaMultiReturn<[undefined | number, string]> {
        let [num, rem] = string.match(str, "^([%d%.]+)([%s%S]*)")
        if ( num == undefined ) return $multi(undefined, rem)
        return $multi(Number(num), rem)
    }

    export function calculateString(expression: string, expectEndParentheses?: boolean): LuaMultiReturn<[undefined | number, string]> {
        if ( string.find(expression, "^[0-9%.%+%-%*%/%^%(%)%s]*$")[0] == undefined ) {
            return $multi(undefined, "")
        }
        if ( expectEndParentheses == undefined ) {
            [expression] = string.gsub(expression, "%s+", "")
        }

        // This is true if and only if we are expecting an expression next instead of an operator.
        let expectingExpression = true
        // This is true if and only if the last expression examined was surrounded by parentheses.
        let lastExpressionWasParenthetical = false
        // These are all the operators in our parser.
        let operators:{[keys: string]: boolean} = { '+': true, '-': true, '*': true, '/': true, '^': true }

        // This is a list of all the parts in our expression.
        let parts:(string | number)[]  = []
        // If expectEndParentheses is not specified, make it default to false.
        expectEndParentheses = expectEndParentheses ?? false


        // We want to parse the expression until we have broken it up into all of its parts and there is nothing left to parse:
        while ( expression != "" ) {
            let [nextNum, exprAfterNum] = getNumber(expression)
            let nextChar = expression.charAt(0)
            // This is the next piece of the expression, used in error messages:
            let nextPiece = expression.slice(0, 4)
            if ( expression.length <= 5 ) nextPiece = nextPiece + " [end]"

            if ( expectingExpression ) {
                if ( nextChar == "(" ) {
                    let [nestedExprVal, exprAfter] = calculateString(expression.slice(1), true)

                    if ( nestedExprVal == undefined ) return $multi(nestedExprVal, exprAfter)
                    parts.push(nestedExprVal)
                    expression = exprAfter
                    lastExpressionWasParenthetical = true
                } else {
                    if ( nextNum == undefined ) return $multi(undefined, `Expected number or '(', but found '${nextPiece}'`)
                    parts.push(nextNum)
                    expression = exprAfterNum
                    lastExpressionWasParenthetical = false
                }
            } else if ( operators[nextChar] ) {
                parts.push(nextChar)
                expression = expression.slice(1)
            } else if ( nextChar == '(' || ( lastExpressionWasParenthetical && nextNum != undefined ) ) {
                parts.push("*")
            } else if ( nextChar == ')' ) {
                if ( expectEndParentheses ) {
                    expression = expression.slice(1)
                    break
                }
                return $multi(undefined, `')' present without matching '(' at '${nextPiece}'`)
            } else {
                return $multi(undefined, `Expected expression, but found '${nextPiece}'`)
            }
            expectingExpression = !expectingExpression
        }

        // if there is a number missing at the end add the identity for the last operator
        if ( expectingExpression ) {
            let lastOp = parts[parts.length - 1]

            if (lastOp == '+' || lastOp == '-') parts.push(0)
            else parts.push(1)
        }

        // Otherwise, the expression has been parsed successfully, so now we must evaulate it.
        // Loop through parts backwards and evaluate the exponentiation operations:
        // Notice that we loop through exponentiation since exponentiation is right-associative (2^3^4=2^81, not 8^4) and that we do not use a for loop since the value of #parts is going to change.
        for ( let i = parts.length; i >= 0; i-- ) {
            // If the current part is an exponentiation operator, evaluate the operation, put the result in the slot of the former number, and remove the operator along with the latter number.
            if ( parts[i] == '^' ) {
                // @ts-ignore
                parts[i-1] = parts[i-1] ** parts[i+1]
                parts.splice(i, 2)
            }
        }

        // Loop through parts forwards and evaluate the multiplication and division operators.
        // Notice that we loop forward since division is left-associative (1/2/4=0.5/4, not 1/0.5).
        for ( let i = 0; i < parts.length; ) {
            if (parts[i] == '*' || parts[i] == '/') {
                // @ts-ignore
                parts[i-1] = parts[i] == '*' ? parts[i-1] * parts[i+1] : parts[i-1] / parts[i+1]
                parts.splice(i, 2)
            } else {
                // Increment if the current part is not an operator.
                // Notice that we make this incrementation conditional. This is because since we are going backwards, incrementing after we have just processed an operator could make us skip a multiplication or division operator by hopping over it.
                // To understand this better, examine the expression "1/2/3". How does making this incrementation conditional prevent us from skipping over a division operator?
                i++;
            }
        }

        // Loop through parts forwards and evaluate the addition and subtraction operators.
        // Notice that we loop forward since subtraction is left-associative (1-2-3=-1-3, not 1-(-1)).
        for ( let i = 0; i < parts.length; ) {
            if (parts[i] == '+' || parts[i] == '-') {
                // @ts-ignore
                parts[i-1] = parts[i] == '+' ? parts[i-1] + parts[i+1] : parts[i-1] - parts[i+1]
                parts.splice(i, 2)
            } else {
                // Just like with multiplication and division, increment i if the current part is not an operator.
                i++;
            }
        }

        return $multi(parts[0] as number, expression)
    }
}

export default QSMath