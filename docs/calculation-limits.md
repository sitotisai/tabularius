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

## Differences from FileMaker

FileMaker's own limits for these cases were not measured. <!-- known-difference: SQL and calculations ;; The 512-level limit on JSON documents and the 100-level limit on nested Evaluate calls are Tabularius's own; FileMaker's limits for the same input are not measured; comparison unverified ;; A document nested deeper than 512 levels, a JSONSetElement path of more than 512 parts, or Evaluate nested deeper than 100 levels gives ? where FileMaker may give a value ;; A FileMaker run with a JSON text nested past 512 levels and with Evaluate nested past 100 levels -->

Not covered by these limits: `BE_JSONPath ( F ; "$" )` on a text nested about 100,000 levels deep throws a raw stack
overflow, as it did before; the limits above apply to the JSON functions, not to the `BE_` functions.
