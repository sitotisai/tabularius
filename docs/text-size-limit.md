# Text size limit

`&`, `Substitute`, `Replace` and `List` refuse a result of more than 8,000,000 characters before they build it, and so do
the functions that make text longer than their input. (Not every function checks: `Quote` of a text of 2,000,000 quotation
marks, three times over, gives 16,000,014 characters.)

| Function | Result length checked |
| --- | --- |
| `Code` | 5 digits for each character of the text, 6 for one from U+186A0 and 7 for one from U+F4240 (an emoji is 6) |
| `HexEncode` | 2 characters for each byte of the text (or container) |
| `Base64Encode`, `Base64EncodeRFC` | 4 characters for each 3 bytes, with the line breaks |
| `GetAsURLEncoded` | 1 character for a letter or digit, 3 for each other ASCII character, and 3 for each byte of any other (a lone surrogate is the replacement character, `%EF%BF%BD`) |
| `CryptEncryptBase64` | the Base64 of the encrypted data and its 52-byte header, with the file name of a container |
| `BE_EncryptAES` | the Base64 of the text's UTF-8 bytes and 33 more |
| `BE_CipherEncrypt` with no file name | 2 characters for each byte of the data and one more block of padding |
| `MBS ( "Container.GetBase64" )`, `"Container.GetDataURL"` | 4 characters for each 3 bytes (and the `data:` prefix) |

A result over the limit is a refusal, as for `Substitute`: the calculation stops with error 1200 and the record write or
read that ran it is undone, instead of the server running out of memory. Before this check, `HexEncode` or `Code`
nested a few levels deep over a text of a couple of megabytes stopped the whole server.

A container that a field or a file holds is the exception for the functions that write one out as text (`HexEncode`,
`Base64Encode`, `Base64EncodeRFC`, `CryptEncryptBase64`, `BE_CipherEncrypt`, `MBS ( "Container.GetBase64" )` and
`"Container.GetDataURL"`): a stored picture or PDF can be tens of megabytes and its Base64
text is read back whole, so a stored container is encoded as long as the text fits in memory (about 536 million
characters). A container that a calculation made (`TextEncode`, `Base64Decode` or `HexDecode` with a file name, `BE_UnGzip`
and the like) has no such exemption: it is held to the 8,000,000 characters like text. Otherwise `HexEncode` of it (twice
its size) and `Base64Decode` of the hex text (0.75 of it) would take turns and grow it by half each round. So
`HexEncode ( TextEncode ( x ) )` is refused over 4,000,000 bytes, and a stored container that is encoded, decoded with a
file name and encoded again is refused the second time (the first decode still gives the file back).

Not covered, and open: the container a script step stores into a field is a stored one in the next step, so a script that
does this once in each of many steps still grows a file by half each time; `BE_UnGzip` makes a container of up to 256
million bytes from a small one (that container is a calculation's, so encoding it is refused over the limit, but it is held
in memory); and the MBS Dictionary, List and Math encoders have their own caps (`mbs-output-limits`) that were not
examined for this. `CryptEncrypt` makes a container a few dozen bytes longer than its input, and `BE_FileReplaceText` is
held to the regular-expression time budget.

`Char` takes a number below 1e21: its digits, five at a time, are the characters, and a number with an exponent in its
text (1e21 and up) has none, so `Char ( 1e21 )` is an error (`?`) rather than a failure of the server.
