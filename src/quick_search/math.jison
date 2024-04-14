
/* description: Parses and executes mathematical expressions. */

/* lexical grammar */
%options flex

{{
let Quantity = require('./Quantity.ts')
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
    : exp EOF { console.log("EOF:\t" + $1.toString()); return $1; }
    | exp { console.log("end:\t" + $1.toString()); return $1; }
    ;

exp
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
