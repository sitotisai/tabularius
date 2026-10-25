# Text size limit

A calculation result is text of at most 8,000,000 characters. `&`, `Substitute`, `Replace` and `List` refuse a longer
result before they build it, and so do the functions that make text longer than their input:

| Function | Result length checked |
| --- | --- |
| `Code` | 5 characters for each character of the text |
| `HexEncode` | 2 characters for each byte of the text (or container) |
| `Base64Encode`, `Base64EncodeRFC` | 4 characters for each 3 bytes, with the line breaks |
| `GetAsURLEncoded` | 1 character for a letter or digit, 3 for each other ASCII character, and 3 for each byte of any other |
| `CryptEncryptBase64` | the Base64 of the encrypted data and its 52-byte header, with the file name of a container |
| `BE_EncryptAES` | the Base64 of the text's UTF-8 bytes and 33 more |
| `BE_CipherEncrypt` with no file name | 2 characters for each byte of the data and one more block of padding |
| `MBS ( "Container.GetBase64" )`, `"Container.GetDataURL"` | 4 characters for each 3 bytes (and the `data:` prefix) |
| `TextEncode` | the UTF-8 bytes of the text, since the container it makes is encoded whole (see below) |

A result over the limit is a refusal, as for `Substitute`: the calculation stops with error 1200 and the record write or
read that ran it is undone, instead of the server running out of memory. Before this check, `HexEncode` or `Code`
nested a few levels deep over a text of a couple of megabytes stopped the whole server.

A container is the exception for the functions that write one out as text (`HexEncode`, `Base64Encode`,
`Base64EncodeRFC`, `CryptEncryptBase64`, `BE_CipherEncrypt`, `MBS ( "Container.GetBase64" )` and `"Container.GetDataURL"`):
a stored picture is several megabytes and its Base64 text is read back whole, so a container is encoded as long as the
text fits in memory (about 536 million characters). What stops that from being used to make text without end is where
a container can come from. `TextEncode` is the one function that turns any text into a container without shrinking
it, and it takes no more than 8,000,000 bytes, so `HexEncode ( TextEncode ( x ) )` is at most 16,000,000 characters and
`TextEncode` refuses that text when it is fed back. The other functions that make a container do not grow it
from round to round: `HexDecode` and `Base64Decode` make one no longer than their text, `CryptEncrypt` one a few dozen
bytes longer than its input, and `BE_UnGzip` and `BE_FileReplaceText` are held to their own limits (256 million bytes
for a decompressed file, the regular-expression time budget for a replacement). The text a container made is over the
limit, so the functions in the table above refuse it.

`Char` takes a number below 1e21: its digits, five at a time, are the characters, and a number with an exponent in its
text (1e21 and up) has none, so `Char ( 1e21 )` is an error (`?`) rather than a failure of the server.
