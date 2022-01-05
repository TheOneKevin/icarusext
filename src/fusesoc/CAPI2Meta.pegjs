{
    function evaluateCondition(cond) {
        if(!options.conditions || !cond in options.conditions)
            return false;
        return options.conditions[cond];
    }
}

/**
 * Parse CAPI2 string expressions that follow this grammar:
 * 
 * exprs        ::= expr exprs | expr
 * expr         ::= conditional | word
 * word         ::= WORD
 * conditional  ::= condition TERNARY LPAREN exprs RPAREN
 * condition    ::= word | NOT word
 * WORD         = [a-zA-Z0-9:<>.\[\]_-,=~/^+]+
 * NOT          = !
 * LPAREN       = (
 * RPAREN       = )
 * TERNARY      = ?
 */

exprs = l:expr _ r:exprs {
    if(Array.isArray(l))
        return l.concat(r);
    if(Array.isArray(r))
        return [l].concat(r);
    return [l,r];
} / expr:expr {
    return [].concat(expr);
};

expr = conditional / word;

word = [a-zA-Z0-9:<>.\[\]_,-=~/^+]+ {
    return text();
}

conditional = cond:condition _ "?" _ "(" _ exprs:exprs _ ")" {
    if(cond)
        return exprs;
    return [];
}

condition = word:word {
    return evaluateCondition(word);
} / "!" _ word:word {
    return !evaluateCondition(word);
}

_ "whitespace" = [ \t]*