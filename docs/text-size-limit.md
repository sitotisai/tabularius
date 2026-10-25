# Text size limit

A calculation result is text of at most 8,000,000 characters. `&`, `Substitute`, `Replace` and `List` refuse a longer
result before they build it, and so do the functions that make text longer than their input:

| Function | Result length checked |
| --- | --- |
| `Code` | 5 characters for each character of the text |
| `HexEncode` | 2 characters for each byte of the text (or container) |
| `Base64Encode`, `Base64EncodeRFC` | 4 characters for each 3 bytes, with the line breaks |
| `GetAsURLEncoded` | 1 character for a letter or digit, 3 for each other ASCII character, and 3 for each byte of any other |

A result over the limit is a refusal, as for `Substitute`: the calculation stops with error 1200 and the record write or
read that ran it is undone, instead of the server running out of memory. Before this check, `HexEncode` or `Code`
nested a few levels deep over a text of a couple of megabytes stopped the whole server.

A container is the exception for `HexEncode`, `Base64Encode` and `Base64EncodeRFC`: a stored picture is several megabytes
and its Base64 text is read back whole, so a container is encoded as long as the text fits in memory (about 536 million
characters). The text that makes is then over the limit for every function that takes text and grows it, so it cannot be
multiplied further.

`Char` takes a number below 1e21: its digits, five at a time, are the characters, and a number with an exponent in its
text (1e21 and up) has none, so `Char ( 1e21 )` is an error (`?`) rather than a failure of the server.
