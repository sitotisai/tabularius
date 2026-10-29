---
since: 0.1.0
---

# tabularius serve --ai-image-embed-model

Since 0.1.0

`--ai-image-embed-model` is a serve option. The full command usage is in [serve](../../cli/serve.md).

| Setting | Value |
| --- | --- |
| Default | Provider default model |
| Accepted values | Image embedding model id |
| Restart needed | Yes; serve flags are read when the server starts. |
| Environment | [`TABULARIUS_AI_IMAGE_EMBED`](../environment/tabularius_ai_image_embed.md), [`TABULARIUS_AI_IMAGE_EMBED_MODEL`](../environment/tabularius_ai_image_embed_model.md) |
| Explained in | [docs/local-embeddings.md](../../../local-embeddings.md) |
| Code | [packages/cli/src/main.ts:1443](../../../../packages/cli/src/main.ts#L1443) |

[All serve flags](../serve-flags.md)
