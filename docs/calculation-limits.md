# Calculation limits

A calculation that would run the server out of stack, memory or time is stopped with the error value (`?`) instead of
being run to the end. Most limits are on how much work a formula may do. These are the ones that depend on how deeply
text or a formula is nested, which a person can store in a field.

## JSON documents

The JSON functions (`JSONParse`, `JSONGetElement`, `JSONSetElement`, `JSONDeleteElement`, `JSONListKeys`,
`JSONListValues`, `JSONGetElementType`, `JSONFormatElements` and `JSONMakeArray`) refuse a document nested more than 512
levels of objects and arrays deep. The result is `? The document is nested more than 512 levels deep`, and `JSONParse`
reports the document as invalid. The limit applies to what a function writes as well as to what it reads:
`JSONSetElement` and `JSONMakeArray` give `?` when putting a document into another would make the result more than 512
levels deep, even if each document is within it. `JSONSetElement` and `JSONDeleteElement` also refuse a path of more
than 512 parts (`[0][0][0]...`), since it could not give a document within the limit. The functions that only read
(`JSONGetElement`, `JSONGetElementType`, `JSONListKeys`, `JSONListValues`) accept a path of any length, and one that is
longer than the document is deep finds nothing, as before. If the server's stack runs out inside a JSON function (a
formula that is already deeply nested), the result is `? The document or formula is nested too deeply for this server's
stack`.

Before this limit, a document of a few thousand levels read fine as text but ran the server's stack out in every function
that writes or lists it, and a stored or unstored calculation that read such a field failed the whole read or write of the
record. Real documents are nowhere near 512 levels. The `MBS ( "JSON.*" )` functions already had the same limit.

## Evaluate

`Evaluate` calls may be inside one another up to 100 levels deep, as when text evaluates itself: a calculation field of
`Evaluate ( Notes )` over a text field `Notes` that holds `Evaluate ( Notes )`. The 101st level gives error 1200 with the
message `Evaluate is nested more than 100 levels deep`; a formula that has already recursed far through a custom function
can reach the stack's end sooner and gives the same error. Evaluate calls one after another, or inside different
arguments, do not add up.

A custom function that calls itself through `Evaluate` (for example `Evaluate ( "Name ( " & n - 1 & " )" )`) is
counted the same way: it works up to 100 levels and gives `?` from the 101st. A recursion of more than 100 levels that
went through `Evaluate` used to finish; it now stops at the limit. Recursion that does not use `Evaluate` is not
affected by this limit.

Once Evaluate calls have nested to the limit, every `Evaluate` that is inside another is refused until the outermost one
has ended. `EvaluationError` can catch the refusal, and a text that evaluates itself twice at each level, such as
`EvaluationError ( Evaluate ( G ) ) + EvaluationError ( Evaluate ( G ) )`, would otherwise try every path through the 100
levels. With the refusal the work is proportional to the depth, the record reads back at once, and the calculation is
whatever the caught errors add up to (here a number, not `?`). Evaluate calls made after the outermost one has ended run as
usual.

## Custom function recursion

A custom function may call itself, directly or through other custom functions, up to 10,000 calls deep, as in FileMaker.
The 10,001st call gives error 1200 with the message `Name recursed too deeply: it passed Tabularius's limit of 10,000 nested calls. Rewrite Name as a loop with While.`
`SetRecursion` can lower the limit for one expression; then the message says `Name recursed too deeply: it passed 20 nested calls, the limit SetRecursion set. Raise the limit in SetRecursion (up to 10,000), or rewrite Name as a loop with While.` (with the limit actually set in place of 20). The shape of the function makes no difference: one that waits for its own result (`n + Sum1 ( n - 1 )`),
one whose call sits inside a `Let`, one that builds a list with `List ( item ; Rest ( n - 1 ) )` or a document with
`JSONSetElement`, and one that only passes a running total along all reach 10,000 calls. The evaluator keeps a stack of
its own for the parts of a formula and does not use the server's, so a formula's own nesting is not limited by the
server either: one nested as deep as the parser allows (1,000 levels of parentheses, calls or `Let`) evaluates.

A built-in that reads its arguments itself rather than taking their values (`While`, `Evaluate`, `EvaluationError`,
`IsValid`, `IsEmpty`, `SetRecursion`, `GetField`, `GetFieldName`, `GetNthRecord`, `Last`, `Lookup`, `Extend`,
`GetSummary`, `NPV`, `ExecuteSQL`, the design functions and the plug-in functions that take a formula) uses the server's
stack once for each level of recursion that passes through it. A function that calls itself inside one of these works a
few hundred levels at least, and when the server's stack does run out the result is the same error 1200, `Name recursed
too deeply: this server's stack ran out at level N (Tabularius allows 10,000 nested calls). Rewrite Name as a loop with While.`, not a failure of the read or write that
ran the formula.

A loop with `While` is the way past the custom-function limit: it allows 50,000 iterations by default, within the calculation's work budget; `SetRecursion` changes the iteration limit too. The conversion report lists custom functions that call themselves directly or through other custom functions, so a developer can review them before users encounter the limit. This list uses parsed calls; it cannot see calls built as text for `Evaluate`.

Before this, a function that waited for its own result stopped where the server's stack ran out, near 500 calls, and
the number functions that keep a decimal argument's digits (`Abs`, `Int`, `Round`, `Truncate`, `Mod`, `Div`, `Sum`,
`Average`, `Min`, `Max`) read each argument twice, so thirty of them nested inside one another took a billion steps.

## Differences from FileMaker

FileMaker documents 50,000 calls for a custom function whose call to itself is the last thing it does and 10,000 for any
other; Tabularius stops both at 10,000. <!-- known-difference: SQL and calculations ;; A custom function whose call to itself is the last thing it does (tail recursion) stops at 10,000 calls, the limit for every recursion here, where FileMaker documents 50,000 ;; A tail-recursive custom function that goes past 10,000 calls gives ? where FileMaker may finish ;; A FileMaker run of a tail-recursive custom function at 20,000 calls -->

FileMaker's own limits for these cases were not measured. <!-- known-difference: SQL and calculations ;; The 512-level limit on JSON documents and the 100-level limit on nested Evaluate calls are Tabularius's own; FileMaker's limits for the same input are not measured ;; A document nested deeper than 512 levels, a JSONSetElement path of more than 512 parts, or Evaluate nested deeper than 100 levels gives ? where FileMaker may give a value ;; A FileMaker run with a JSON text nested past 512 levels and with Evaluate nested past 100 levels -->

Not covered by these limits: `BE_JSONPath ( F ; "$" )` on a text nested about 100,000 levels deep throws a raw stack
overflow, as it did before; the limits above apply to the JSON functions, not to the `BE_` functions.
