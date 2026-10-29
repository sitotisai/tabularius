---
since: 0.1.0
---

# tabularius serve --ldap-email-attribute

Since 0.1.0

`--ldap-email-attribute` is a serve option. The full command usage is in [serve](../../cli/serve.md).

| Setting | Value |
| --- | --- |
| Default | Unset |
| Accepted values | LDAP distinguished name, template, attribute, or password as named by the variable |
| Restart needed | Yes; serve flags are read when the server starts. |
| Environment | [`TABULARIUS_LDAP_EMAIL_ATTRIBUTE`](../environment/tabularius_ldap_email_attribute.md) |
| Explained in | [docs/reference/settings/serve-flags.md](../serve-flags.md) |
| Code | [packages/cli/src/main.ts:1437](../../../../packages/cli/src/main.ts#L1437) |

[All serve flags](../serve-flags.md)
