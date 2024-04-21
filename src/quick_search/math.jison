
/* description: Parses and executes mathematical expressions. */

/* lexical grammar */
%options flex

{{
let Quantity = require('./Quantity.ts').default
}}

%lex
%%

\s+                   /* skip whitespace */
[0-9]+("."[0-9]+)?  return 'NUMBER'

/* Operators */
"*"                   return 'TIMES'
"/"                   return 'DIVIDE'
"-"                   return 'MINUS'
"+"                   return 'PLUS'
"^"                   return 'POWER'
"!"                   return 'FACTORIAL'
"%"                   return 'MODULO'
"("                   return 'LPAREN'
")"                   return 'RPAREN'

<<EOF>>               return 'EOF'
\w*                   return 'IDENTIFIER'

/lex

/* operator associations and precedence */

%left 'PLUS' 'MINUS'
%left 'TIMES' 'DIVIDE' 'MODULO'
%left 'POWER'
%right 'FACTORIAL'
%right 'MODULO' 'SI' 'UNIT'
%left UMINUS
%right PAREN

%start expressions

%% /* language grammar */

expressions
    : AdditiveExpression EOF { console.log("EOF:\t" + $1.toString()); return $1; }
    | AdditiveExpression { console.log("end:\t" + $1.toString()); return $1; }
    ;

__unused__exp
    : factor
    | exp partial_exp EOF               -> $1
    | exp PLUS exp                      -> $1.add($3)
    | exp MINUS exp                     -> $1.sub($3)
    | exp TIMES exp                     -> $1.mul($3)
    | exp DIVIDE exp                    -> $1.div($3)
    | exp MODULO exp                    -> $1.mod($3)
    | exp POWER exp                     -> $1.pow($3)
    | exp FACTORIAL                     -> $1.factorial()
    | MINUS exp %prec UMINUS            -> $2.mul(-1)
    | LPAREN exp [RPAREN] %prec PAREN   -> $2
//    | factor MODULO %prec PERCENT       -> $1.mul(1/100)
    ;

partial_exp
    : (PLUS | MINUS | TIMES | DIVIDE | MODULO | POWER)             -> $1
    ;

factor
    : NUMBER IDENTIFIER -> Quantity.fromNumberWithUnit(Number($1), $2)
    | NUMBER            -> Quantity.fromNumber(Number($1))
    | IDENTIFIER        -> Quantity.fromUnit($1)
    ;

AdditiveExpression
    : MultiplicativeExpression
    | AdditiveExpression PLUS AdditiveExpression    -> $1.add($3)
    | AdditiveExpression MINUS AdditiveExpression   -> $1.sub($3)
    | AdditiveExpression PLUS EOF                         -> $1
    | AdditiveExpression MINUS EOF                        -> $1
    ;

MultiplicativeExpression
    : ExponentialExpression
    | MultiplicativeExpression TIMES MultiplicativeExpression     -> $1.mul($3)
    | MultiplicativeExpression DIVIDE MultiplicativeExpression    -> $1.div($3)
    | MultiplicativeExpression MODULO MultiplicativeExpression    -> $1.mod($3)
    | MultiplicativeExpression TIMES EOF                       -> $1
    | MultiplicativeExpression DIVIDE EOF                      -> $1
    | MultiplicativeExpression MODULO EOF                      -> $1
    ;

ExponentialExpression
    : UnaryExpression
    | UnaryExpression POWER ExponentialExpression -> $1.pow($3)
    | UnaryExpression POWER EOF                   -> $1
    ;

UnaryExpression
    : PrimaryExpression
    | UnaryExpression FACTORIAL             -> $1.factorial()
    | MINUS UnaryExpression %prec UMINUS    -> $2.mul(-1)
    ;

PrimaryExpression
    : factor
//    | LPAREN AdditiveExpression [RPAREN] %prec PAREN
    | LPAREN AdditiveExpression RPAREN -> $2
    ;