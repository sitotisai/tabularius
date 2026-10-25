# Calculation limits

A calculation that would run the server out of stack, memory or time is stopped with the error value (`?`) instead of
being run to the end. Most limits are on how much work a formula may do. These are the ones that depend on how deeply
text or a formula is nested, which a person can store in a field.

## JSON documents

The JSON functions (`JSONParse`, `JSONGetElement`, `JSONSetElement`, `JSONDeleteElement`, `JSONListKeys`,
`JSONListValues`, `JSONGetElementType`, `JSONFormatElements` and `JSONMakeArray`) refuse a document nested more than 512
levels of objects and arrays deep. The result is `? The document is nested more than 512 levels deep`, and `JSONParse`
reports the document as invalid. A path with more than 512 parts (`[0][0][0]...`) is refused the same way.

Before this limit, a document of a few thousand levels read fine as text but ran the server's stack out in every function
that writes or lists it, and a stored or unstored calculation that read such a field failed the whole read or write of the
record. Real documents are nowhere near 512 levels. The `MBS ( "JSON.*" )` functions already had the same limit.

## Evaluate

`Evaluate` calls may be inside one another up to 100 levels deep, as when text evaluates itself: a calculation field of
`Evaluate ( Notes )` over a text field `Notes` that holds `Evaluate ( Notes )`. The 101st level gives error 1200 with the
message `Evaluate is nested more than 100 levels deep`; a formula that has already recursed far through a custom function
can reach the stack's end sooner and gives the same error. Evaluate calls one after another, or inside different
arguments, do not add up.
