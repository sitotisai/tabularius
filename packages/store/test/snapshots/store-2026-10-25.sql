CREATE TABLE "Clients" (_fm_record_id INTEGER PRIMARY KEY, _fm_mod_id INTEGER NOT NULL DEFAULT 0, "Name" TEXT, "Email" TEXT, "Balance" REAL, "Photo" INTEGER);
CREATE TABLE _fm_account_import_limits (
    actor TEXT NOT NULL, kind TEXT NOT NULL, window INTEGER NOT NULL, count INTEGER NOT NULL,
    PRIMARY KEY (actor, kind));
CREATE TABLE _fm_account_import_receipts (
    key TEXT PRIMARY KEY, actor TEXT NOT NULL, digest TEXT NOT NULL, result TEXT NOT NULL);
CREATE TABLE _fm_accounts (name TEXT PRIMARY KEY, password_hash TEXT, source TEXT NOT NULL, privilege_set TEXT, inactive INTEGER NOT NULL DEFAULT 0, must_change INTEGER NOT NULL DEFAULT 0, password_changed TEXT, local_only INTEGER NOT NULL DEFAULT 0, require_2fa INTEGER NOT NULL DEFAULT 0, identity_id TEXT, created_by TEXT, needs_approval INTEGER NOT NULL DEFAULT 0, password_disabled INTEGER NOT NULL DEFAULT 0);
CREATE TABLE _fm_api_tokens (id TEXT PRIMARY KEY, label TEXT, account TEXT NOT NULL,
      token_hash TEXT NOT NULL, read_only INTEGER NOT NULL DEFAULT 0, created TEXT NOT NULL, expires TEXT, last_used TEXT, surfaces TEXT, layouts TEXT, identity TEXT, provenance TEXT);
CREATE TABLE _fm_audit (seq INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT NOT NULL, account TEXT,
      kind TEXT NOT NULL, tbl TEXT NOT NULL, record_id INTEGER, changes TEXT, security INTEGER NOT NULL DEFAULT 0, agent INTEGER NOT NULL DEFAULT 0, surface TEXT, script TEXT, copy_of INTEGER, revert_of INTEGER, chain_seq INTEGER, prev_hash TEXT, event_hash TEXT, rchain_seq INTEGER, rprev_hash TEXT, rhash TEXT);
CREATE TABLE _fm_cache_version (id INTEGER PRIMARY KEY CHECK (id = 1), n INTEGER NOT NULL);
CREATE TABLE _fm_container_chunks (id INTEGER NOT NULL, n INTEGER NOT NULL, data BLOB NOT NULL, PRIMARY KEY (id, n)) WITHOUT ROWID;
CREATE TABLE _fm_container_versions (id INTEGER PRIMARY KEY, token TEXT NOT NULL);
CREATE TABLE _fm_containers (id INTEGER PRIMARY KEY, filename TEXT, mime TEXT NOT NULL, kind TEXT, data BLOB NOT NULL, external TEXT, external_size INTEGER, stored INTEGER, sha256 TEXT);
CREATE TABLE _fm_design_log (seq INTEGER PRIMARY KEY, at TEXT NOT NULL, account TEXT, op TEXT NOT NULL);
CREATE TABLE _fm_images (id INTEGER PRIMARY KEY, filename TEXT, mime TEXT NOT NULL, data BLOB NOT NULL);
CREATE TABLE _fm_layouts (name TEXT PRIMARY KEY, layout_id INTEGER, table_name TEXT, occurrence TEXT, file TEXT, file_table_id INTEGER);
CREATE TABLE _fm_meta (key TEXT PRIMARY KEY, json TEXT NOT NULL);
CREATE TABLE _fm_metadata_versions (
    id INTEGER PRIMARY KEY CHECK (id = 1), design INTEGER NOT NULL, privileges INTEGER NOT NULL);
CREATE TABLE _fm_passkeys (id TEXT PRIMARY KEY, account TEXT NOT NULL COLLATE NOCASE,
      public_key TEXT NOT NULL, sign_count INTEGER NOT NULL DEFAULT 0, alg INTEGER NOT NULL, label TEXT,
      created TEXT NOT NULL, last_used TEXT);
CREATE TABLE _fm_pending (id INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT NOT NULL, agent TEXT NOT NULL,
      kind TEXT NOT NULL, layout TEXT NOT NULL, tbl TEXT NOT NULL, record_id INTEGER, data TEXT, mod_id INTEGER, summary TEXT NOT NULL);
CREATE TABLE _fm_privileges (name TEXT PRIMARY KEY, json TEXT NOT NULL);
CREATE TABLE _fm_record_chain_state (id INTEGER PRIMARY KEY CHECK (id = 1), version INTEGER NOT NULL,
      chain_id TEXT NOT NULL, created_at TEXT NOT NULL, legacy_through INTEGER NOT NULL, genesis_hash TEXT NOT NULL,
      head_seq INTEGER NOT NULL, head_audit_seq INTEGER NOT NULL, head_hash TEXT NOT NULL,
      pruned_seq INTEGER NOT NULL DEFAULT 0, pruned_audit_seq INTEGER NOT NULL DEFAULT 0, pruned_hash TEXT, pruned_at TEXT);
CREATE TABLE _fm_record_id_high_water (tbl TEXT PRIMARY KEY COLLATE NOCASE, id INTEGER NOT NULL);
CREATE TABLE _fm_recovery_codes (account TEXT NOT NULL COLLATE NOCASE, code_hash TEXT NOT NULL,
      used TEXT, created TEXT NOT NULL, PRIMARY KEY (account, code_hash));
CREATE TABLE _fm_security_chain_state (id INTEGER PRIMARY KEY CHECK (id = 1),
      version INTEGER NOT NULL, chain_id TEXT NOT NULL, created_at TEXT NOT NULL,
      legacy_through INTEGER NOT NULL, legacy_count INTEGER NOT NULL, genesis_hash TEXT NOT NULL,
      head_seq INTEGER NOT NULL, head_audit_seq INTEGER NOT NULL, head_hash TEXT NOT NULL);
CREATE TABLE _fm_sign_in_ledger (key TEXT PRIMARY KEY, mark TEXT NOT NULL, gen INTEGER NOT NULL);
CREATE TABLE _fm_text_styles (tbl INTEGER NOT NULL, record_id INTEGER NOT NULL, field INTEGER NOT NULL, rep INTEGER NOT NULL DEFAULT 1,
    hash TEXT NOT NULL, runs TEXT NOT NULL, PRIMARY KEY (tbl, record_id, field, rep)) WITHOUT ROWID;
CREATE TABLE _fm_totp (account TEXT PRIMARY KEY, secret TEXT NOT NULL,
      confirmed INTEGER NOT NULL DEFAULT 0, created TEXT NOT NULL, last_step INTEGER);
CREATE TABLE _fm_webauthn_challenges (challenge TEXT PRIMARY KEY, account TEXT, kind TEXT NOT NULL, created TEXT NOT NULL);
CREATE TRIGGER _fm_accounts_version_delete
        AFTER DELETE ON _fm_accounts  BEGIN
          UPDATE _fm_metadata_versions SET privileges = privileges + 1 WHERE id = 1;
        END;
CREATE TRIGGER _fm_accounts_version_insert
        AFTER INSERT ON _fm_accounts  BEGIN
          UPDATE _fm_metadata_versions SET privileges = privileges + 1 WHERE id = 1;
        END;
CREATE TRIGGER _fm_accounts_version_update
        AFTER UPDATE ON _fm_accounts  BEGIN
          UPDATE _fm_metadata_versions SET privileges = privileges + 1 WHERE id = 1;
        END;
CREATE TRIGGER _fm_container_chunks_identity_delete
        AFTER DELETE ON _fm_container_chunks BEGIN
          INSERT INTO _fm_container_versions VALUES (OLD.id, lower(hex(randomblob(16))))
            ON CONFLICT(id) DO UPDATE SET token = excluded.token;
        END;
CREATE TRIGGER _fm_container_chunks_identity_insert
        AFTER INSERT ON _fm_container_chunks BEGIN
          INSERT INTO _fm_container_versions VALUES (NEW.id, lower(hex(randomblob(16))))
            ON CONFLICT(id) DO UPDATE SET token = excluded.token;
        END;
CREATE TRIGGER _fm_container_chunks_identity_update
        AFTER UPDATE ON _fm_container_chunks BEGIN
          INSERT INTO _fm_container_versions VALUES (NEW.id, lower(hex(randomblob(16))))
            ON CONFLICT(id) DO UPDATE SET token = excluded.token;
        END;
CREATE INDEX _fm_containers_hash ON _fm_containers (sha256, mime, filename) WHERE external IS NULL AND sha256 IS NOT NULL;
CREATE TRIGGER _fm_containers_identity_delete
        AFTER DELETE ON _fm_containers BEGIN
          INSERT INTO _fm_container_versions VALUES (OLD.id, lower(hex(randomblob(16))))
            ON CONFLICT(id) DO UPDATE SET token = excluded.token;
        END;
CREATE TRIGGER _fm_containers_identity_insert
        AFTER INSERT ON _fm_containers BEGIN
          INSERT INTO _fm_container_versions VALUES (NEW.id, lower(hex(randomblob(16))))
            ON CONFLICT(id) DO UPDATE SET token = excluded.token;
        END;
CREATE TRIGGER _fm_containers_identity_update
        AFTER UPDATE ON _fm_containers BEGIN
          INSERT INTO _fm_container_versions VALUES (NEW.id, lower(hex(randomblob(16))))
            ON CONFLICT(id) DO UPDATE SET token = excluded.token;
        END;
CREATE TRIGGER "_fm_cv_d_129" AFTER DELETE ON "Clients" BEGIN UPDATE _fm_cache_version SET n = n + 1; END;
CREATE TRIGGER "_fm_cv_i_129" AFTER INSERT ON "Clients" BEGIN UPDATE _fm_cache_version SET n = n + 1; END;
CREATE TRIGGER "_fm_cv_u_129" AFTER UPDATE ON "Clients" BEGIN UPDATE _fm_cache_version SET n = n + 1; END;
CREATE TRIGGER _fm_meta_version_delete
        AFTER DELETE ON _fm_meta WHEN OLD.key IN ('schema', 'designs', 'repeating') BEGIN
          UPDATE _fm_metadata_versions SET design = design + 1 WHERE id = 1;
        END;
CREATE TRIGGER _fm_meta_version_insert
        AFTER INSERT ON _fm_meta WHEN NEW.key IN ('schema', 'designs', 'repeating') BEGIN
          UPDATE _fm_metadata_versions SET design = design + 1 WHERE id = 1;
        END;
CREATE TRIGGER _fm_meta_version_update
        AFTER UPDATE ON _fm_meta WHEN NEW.key IN ('schema', 'designs', 'repeating') OR OLD.key IN ('schema', 'designs', 'repeating') BEGIN
          UPDATE _fm_metadata_versions SET design = design + 1 WHERE id = 1;
        END;
CREATE TRIGGER _fm_privileges_version_delete
        AFTER DELETE ON _fm_privileges  BEGIN
          UPDATE _fm_metadata_versions SET privileges = privileges + 1 WHERE id = 1;
        END;
CREATE TRIGGER _fm_privileges_version_insert
        AFTER INSERT ON _fm_privileges  BEGIN
          UPDATE _fm_metadata_versions SET privileges = privileges + 1 WHERE id = 1;
        END;
CREATE TRIGGER _fm_privileges_version_update
        AFTER UPDATE ON _fm_privileges  BEGIN
          UPDATE _fm_metadata_versions SET privileges = privileges + 1 WHERE id = 1;
        END;
CREATE INDEX _fm_record_audit_chain ON _fm_audit(rchain_seq) WHERE rchain_seq IS NOT NULL;
CREATE TRIGGER "_fm_rid_Clients" AFTER INSERT ON "Clients" BEGIN
        INSERT INTO _fm_record_id_high_water (tbl, id) VALUES ('Clients', NEW._fm_record_id)
        ON CONFLICT(tbl) DO UPDATE SET id = max(id, excluded.id);
      END;
CREATE INDEX _fm_security_audit_chain ON _fm_audit(seq) WHERE security = 1 OR chain_seq IS NOT NULL OR prev_hash IS NOT NULL OR event_hash IS NOT NULL;
INSERT INTO "Clients" ("_fm_record_id", "_fm_mod_id", "Name", "Email", "Balance", "Photo") VALUES (1,2,'Ann Example','ann@example.test',40.0,1);
INSERT INTO "Clients" ("_fm_record_id", "_fm_mod_id", "Name", "Email", "Balance", "Photo") VALUES (2,0,'Bo Example','bo@example.test',0.0,NULL);
INSERT INTO "_fm_accounts" ("name", "password_hash", "source", "privilege_set", "inactive", "must_change", "password_changed", "local_only", "require_2fa", "identity_id", "created_by", "needs_approval", "password_disabled") VALUES ('Admin','scrypt$MMOsLAfboO2rfGcFPAgeBw==$gGAtkzsGLdYqAmlseXcN0kj7lcD5AlR3T5QwbEGx9CQ=','openhbam','[Full Access]',0,0,'2026-10-25T14:30:58.199Z',0,0,'60674d62-f0be-4e8f-a5d0-89c726771825',NULL,0,0);
INSERT INTO "_fm_api_tokens" ("id", "label", "account", "token_hash", "read_only", "created", "expires", "last_used", "surfaces", "layouts", "identity", "provenance") VALUES ('dea5bbc44e39','sample','Admin','28b3fb87456b26e0c6effab8303da1effb62dc4e2404b1ead6e6c8f3221a8fc5',1,'2026-10-25T14:30:58.204Z','2027-01-23T14:30:58.203Z',NULL,NULL,NULL,NULL,'service');
INSERT INTO "_fm_audit" ("seq", "at", "account", "kind", "tbl", "record_id", "changes", "security", "agent", "surface", "script", "copy_of", "revert_of", "chain_seq", "prev_hash", "event_hash", "rchain_seq", "rprev_hash", "rhash") VALUES (1,'2026-10-25T14:30:58.168Z',NULL,'schema-changed','',NULL,'{"ops":{"createTable":1,"createValueList":1,"createScript":1},"count":3}',1,0,NULL,NULL,NULL,NULL,1,'b4ed667d4c30eb3018728df2c1f322c6ff92f7e249c74b509e311389e17a68d0','917bc6e9f4a2d4f5f70f712ae98bf36fc9b62c3ca0d5a6f5d6cb9fae2d6bec2f',NULL,NULL,NULL);
INSERT INTO "_fm_audit" ("seq", "at", "account", "kind", "tbl", "record_id", "changes", "security", "agent", "surface", "script", "copy_of", "revert_of", "chain_seq", "prev_hash", "event_hash", "rchain_seq", "rprev_hash", "rhash") VALUES (2,'2026-10-25T14:30:58.171Z','Admin','create','Clients',1,'{"Name":"Ann Example","Email":"ann@example.test","Balance":12.5}',0,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,'7a8f7d91f41a5c8fbbad3e0e5b6fca27bcea0cff4296e094a4e568773d2a69a0','ca0263348e00567f9b1c75d928e0f8263aa8b28d8365e2237ae1ef0654a6de0f');
INSERT INTO "_fm_audit" ("seq", "at", "account", "kind", "tbl", "record_id", "changes", "security", "agent", "surface", "script", "copy_of", "revert_of", "chain_seq", "prev_hash", "event_hash", "rchain_seq", "rprev_hash", "rhash") VALUES (3,'2026-10-25T14:30:58.172Z','Admin','create','Clients',2,'{"Name":"Bo Example","Email":"bo@example.test","Balance":0}',0,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,2,'ca0263348e00567f9b1c75d928e0f8263aa8b28d8365e2237ae1ef0654a6de0f','1199a649faa0772e24e09449db8fa204a8e7a37900247a0fba40a6056e5b66ba');
INSERT INTO "_fm_audit" ("seq", "at", "account", "kind", "tbl", "record_id", "changes", "security", "agent", "surface", "script", "copy_of", "revert_of", "chain_seq", "prev_hash", "event_hash", "rchain_seq", "rprev_hash", "rhash") VALUES (4,'2026-10-25T14:30:58.173Z','Admin','update','Clients',1,'{"Balance":[12.5,40]}',0,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,3,'1199a649faa0772e24e09449db8fa204a8e7a37900247a0fba40a6056e5b66ba','f0ca5323ab3cfcc117911d41bfc96c6657a5c914ba6252074820d720fa2de475');
INSERT INTO "_fm_audit" ("seq", "at", "account", "kind", "tbl", "record_id", "changes", "security", "agent", "surface", "script", "copy_of", "revert_of", "chain_seq", "prev_hash", "event_hash", "rchain_seq", "rprev_hash", "rhash") VALUES (5,'2026-10-25T14:30:58.174Z',NULL,'update','Clients',1,'{"Photo":[null,"dot.png (16 bytes, sha256 e90137d39de304eefbbe788bc535c7e82f27abbf8069505fbbd8a9dcdc4f2024)"]}',0,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,4,'f0ca5323ab3cfcc117911d41bfc96c6657a5c914ba6252074820d720fa2de475','ba166ef23562f97966d828979cca997d01d251e27d2a6fc055275d5cec3d9683');
INSERT INTO "_fm_audit" ("seq", "at", "account", "kind", "tbl", "record_id", "changes", "security", "agent", "surface", "script", "copy_of", "revert_of", "chain_seq", "prev_hash", "event_hash", "rchain_seq", "rprev_hash", "rhash") VALUES (6,'2026-10-25T14:30:58.202Z',NULL,'password-changed','',NULL,'{"target":"Admin"}',1,0,NULL,NULL,NULL,NULL,2,'917bc6e9f4a2d4f5f70f712ae98bf36fc9b62c3ca0d5a6f5d6cb9fae2d6bec2f','58177673bdb45b60c271a78f07550078018cef58f6f904d365c405e3314e8970',NULL,NULL,NULL);
INSERT INTO "_fm_audit" ("seq", "at", "account", "kind", "tbl", "record_id", "changes", "security", "agent", "surface", "script", "copy_of", "revert_of", "chain_seq", "prev_hash", "event_hash", "rchain_seq", "rprev_hash", "rhash") VALUES (7,'2026-10-25T14:30:58.203Z',NULL,'privilege-set-assigned','',NULL,'{"privilegeSet":"[Full Access]","target":"Admin"}',1,0,NULL,NULL,NULL,NULL,3,'58177673bdb45b60c271a78f07550078018cef58f6f904d365c405e3314e8970','a1da427955b9efac0090a9dc15f882bf5b35c0cd5ff67fc0ee3fb879a0d9996d',NULL,NULL,NULL);
INSERT INTO "_fm_audit" ("seq", "at", "account", "kind", "tbl", "record_id", "changes", "security", "agent", "surface", "script", "copy_of", "revert_of", "chain_seq", "prev_hash", "event_hash", "rchain_seq", "rprev_hash", "rhash") VALUES (8,'2026-10-25T14:30:58.204Z',NULL,'api-token-issued','',NULL,'{"id":"dea5bbc44e39","label":"sample","readOnly":true,"target":"Admin"}',1,0,NULL,NULL,NULL,NULL,4,'a1da427955b9efac0090a9dc15f882bf5b35c0cd5ff67fc0ee3fb879a0d9996d','3808861692d53b29af2b510e7aa1b756ddc16db6477785d9c15e26e2e9821576',NULL,NULL,NULL);
INSERT INTO "_fm_cache_version" ("id", "n") VALUES (1,4);
INSERT INTO "_fm_container_versions" ("id", "token") VALUES (1,'a79494369f564e8884adfc8594305450');
INSERT INTO "_fm_containers" ("id", "filename", "mime", "kind", "data", "external", "external_size", "stored", "sha256") VALUES (1,'dot.png','image/png','image',X'6E6F74207265616C6C79206120706E67',NULL,NULL,1792938658,'e90137d39de304eefbbe788bc535c7e82f27abbf8069505fbbd8a9dcdc4f2024');
INSERT INTO "_fm_design_log" ("seq", "at", "account", "op") VALUES (1,'2026-10-25T14:30:58.168Z',NULL,'{"op":"createTable","name":"Clients","fields":[{"name":"Name","type":"text","id":1},{"name":"Email","type":"text","id":2},{"name":"Balance","type":"number","id":3},{"name":"Photo","type":"container","id":4}],"id":129,"occurrenceId":129,"layoutId":1}');
INSERT INTO "_fm_design_log" ("seq", "at", "account", "op") VALUES (2,'2026-10-25T14:30:58.168Z',NULL,'{"op":"createValueList","name":"Tiers","values":["Gold","Silver"],"id":1}');
INSERT INTO "_fm_design_log" ("seq", "at", "account", "op") VALUES (3,'2026-10-25T14:30:58.168Z',NULL,'{"op":"createScript","name":"Hello","id":1,"steps":[{"stepId":141,"name":"Set Variable","enabled":true,"params":{"variable":"$x","value":"1"},"calculations":["1"],"line":"Set Variable [ $x ; Value: 1 ]"},{"stepId":103,"name":"Exit Script","enabled":true,"params":{"calculation":"$x"},"calculations":["$x"],"line":"Exit Script [ Result: $x ]"}]}');
INSERT INTO "_fm_layouts" ("name", "layout_id", "table_name", "occurrence", "file", "file_table_id") VALUES ('Clients',1,'Clients','Clients',NULL,NULL);
INSERT INTO "_fm_meta" ("key", "json") VALUES ('accountImportSecret','"3d70ed75146cf68e9bcc763076f03bf8b762ec62115f72375a815e64c3f2f00a"');
INSERT INTO "_fm_meta" ("key", "json") VALUES ('aiPolicy','true');
INSERT INTO "_fm_meta" ("key", "json") VALUES ('dateOrder','"MDY"');
INSERT INTO "_fm_meta" ("key", "json") VALUES ('designVersion','48');
INSERT INTO "_fm_meta" ("key", "json") VALUES ('designs','{"layouts":[{"id":1,"name":"Clients","tableOccurrenceId":129,"width":560,"style":{},"parts":[{"kind":"header","kindId":1,"top":0,"height":60,"style":{}},{"kind":"body","kindId":4,"top":60,"height":160,"style":{}},{"kind":"footer","kindId":7,"top":220,"height":40,"style":{}}],"objects":[{"id":1,"kind":"text","type":2,"bounds":{"top":18,"left":20,"bottom":42,"right":520},"anchors":{"left":true,"top":true,"right":false,"bottom":false},"style":{"element":70,"rules":[{"part":1,"state":1,"css":{"font-size":"18px","font-weight":"600","color":"#1d1d1f"}}]},"text":"Clients"},{"id":2,"kind":"text","type":2,"bounds":{"top":82,"left":20,"bottom":102,"right":150},"anchors":{"left":true,"top":true,"right":false,"bottom":false},"style":{"element":70,"rules":[{"part":1,"state":1,"css":{"color":"#55595f","text-align":"right","padding-right":"8px"}}]},"text":"Name"},{"id":3,"kind":"field","type":1,"bounds":{"top":80,"left":160,"bottom":102,"right":520},"anchors":{"left":true,"top":true,"right":false,"bottom":false},"style":{"element":61,"rules":[{"part":1,"state":1,"css":{"background-color":"#ffffff","border":"1px solid #b9bec7","border-radius":"4px","padding":"2px 4px","color":"#1d1d1f"}}]},"field":{"tableOccurrenceId":129,"fieldId":1,"tableOccurrence":"Clients","field":"Name","display":"edit","repetitions":1}},{"id":4,"kind":"text","type":2,"bounds":{"top":112,"left":20,"bottom":132,"right":150},"anchors":{"left":true,"top":true,"right":false,"bottom":false},"style":{"element":70,"rules":[{"part":1,"state":1,"css":{"color":"#55595f","text-align":"right","padding-right":"8px"}}]},"text":"Email"},{"id":5,"kind":"field","type":1,"bounds":{"top":110,"left":160,"bottom":132,"right":520},"anchors":{"left":true,"top":true,"right":false,"bottom":false},"style":{"element":61,"rules":[{"part":1,"state":1,"css":{"background-color":"#ffffff","border":"1px solid #b9bec7","border-radius":"4px","padding":"2px 4px","color":"#1d1d1f"}}]},"field":{"tableOccurrenceId":129,"fieldId":2,"tableOccurrence":"Clients","field":"Email","display":"edit","repetitions":1}},{"id":6,"kind":"text","type":2,"bounds":{"top":142,"left":20,"bottom":162,"right":150},"anchors":{"left":true,"top":true,"right":false,"bottom":false},"style":{"element":70,"rules":[{"part":1,"state":1,"css":{"color":"#55595f","text-align":"right","padding-right":"8px"}}]},"text":"Balance"},{"id":7,"kind":"field","type":1,"bounds":{"top":140,"left":160,"bottom":162,"right":520},"anchors":{"left":true,"top":true,"right":false,"bottom":false},"style":{"element":61,"rules":[{"part":1,"state":1,"css":{"background-color":"#ffffff","border":"1px solid #b9bec7","border-radius":"4px","padding":"2px 4px","color":"#1d1d1f"}}]},"field":{"tableOccurrenceId":129,"fieldId":3,"tableOccurrence":"Clients","field":"Balance","display":"edit","repetitions":1}},{"id":8,"kind":"text","type":2,"bounds":{"top":172,"left":20,"bottom":192,"right":150},"anchors":{"left":true,"top":true,"right":false,"bottom":false},"style":{"element":70,"rules":[{"part":1,"state":1,"css":{"color":"#55595f","text-align":"right","padding-right":"8px"}}]},"text":"Photo"},{"id":9,"kind":"field","type":1,"bounds":{"top":170,"left":160,"bottom":192,"right":520},"anchors":{"left":true,"top":true,"right":false,"bottom":false},"style":{"element":61,"rules":[{"part":1,"state":1,"css":{"background-color":"#ffffff","border":"1px solid #b9bec7","border-radius":"4px","padding":"2px 4px","color":"#1d1d1f"}}]},"field":{"tableOccurrenceId":129,"fieldId":4,"tableOccurrence":"Clients","field":"Photo","display":"edit","repetitions":1}}],"generated":true,"tableView":[{"field":{"tableOccurrenceId":129,"fieldId":1,"tableOccurrence":"Clients","field":"Name"},"width":120},{"field":{"tableOccurrenceId":129,"fieldId":2,"tableOccurrence":"Clients","field":"Email"},"width":120},{"field":{"tableOccurrenceId":129,"fieldId":3,"tableOccurrence":"Clients","field":"Balance"},"width":120},{"field":{"tableOccurrenceId":129,"fieldId":4,"tableOccurrence":"Clients","field":"Photo"},"width":120}]}],"themes":[]}');
INSERT INTO "_fm_meta" ("key", "json") VALUES ('fileId','"9e7aa192-4faf-4581-a169-bc81b9f1a178"');
INSERT INTO "_fm_meta" ("key", "json") VALUES ('fullAccessClients','true');
INSERT INTO "_fm_meta" ("key", "json") VALUES ('repeating','{}');
INSERT INTO "_fm_meta" ("key", "json") VALUES ('schema','{"header":{"format":"openhbam","encrypted":false,"versionNum":12,"creator":"openhbam","versionDate":""},"tables":[{"id":129,"name":"Clients","fields":[{"id":1,"name":"Name","kind":"normal","type":"text","hasCalculation":false,"options":{"global":false,"unstored":false,"repetitions":1}},{"id":2,"name":"Email","kind":"normal","type":"text","hasCalculation":false,"options":{"global":false,"unstored":false,"repetitions":1}},{"id":3,"name":"Balance","kind":"normal","type":"number","hasCalculation":false,"options":{"global":false,"unstored":false,"repetitions":1}},{"id":4,"name":"Photo","kind":"normal","type":"container","hasCalculation":false,"options":{"global":false,"unstored":false,"repetitions":1}}]}],"tableOccurrences":[{"id":129,"name":"Clients","baseTableId":129}],"relationships":[],"layouts":[{"id":1,"name":"Clients","tableOccurrenceId":129,"labels":[]}],"layoutOrder":[],"scripts":[{"id":1,"name":"Hello","steps":[{"stepId":141,"name":"Set Variable","enabled":true,"params":{"variable":"$x","value":"1"},"calculations":["1"],"line":"Set Variable [ $x ; Value: 1 ]"},{"stepId":103,"name":"Exit Script","enabled":true,"params":{"calculation":"$x"},"calculations":["$x"],"line":"Exit Script [ Result: $x ]"}]}],"scriptOrder":[],"valueLists":[{"id":1,"name":"Tiers","values":["Gold","Silver"]}],"customFunctions":[],"accounts":[{"id":1,"name":"Admin","privilegeSetId":1}],"privilegeSets":[{"id":1,"name":"[Full Access]","records":{"view":true,"create":true,"edit":true,"delete":true},"layouts":"modifiable","valueLists":"modifiable","scripts":"modifiable","extendedPrivileges":["fmapp","fmwebdirect","fmrest"]}],"extendedPrivileges":[{"id":1,"name":"fmapp"},{"id":2,"name":"fmwebdirect"},{"id":3,"name":"fmrest"}],"dataSources":[],"themes":[],"fonts":[],"customMenus":[],"customMenuSets":[]}');
INSERT INTO "_fm_meta" ("key", "json") VALUES ('source','{"file":null,"createdAt":"2026-10-25T14:30:58.150Z"}');
INSERT INTO "_fm_meta" ("key", "json") VALUES ('storeFormat','2');
INSERT INTO "_fm_metadata_versions" ("id", "design", "privileges") VALUES (1,4,4);
INSERT INTO "_fm_record_chain_state" ("id", "version", "chain_id", "created_at", "legacy_through", "genesis_hash", "head_seq", "head_audit_seq", "head_hash", "pruned_seq", "pruned_audit_seq", "pruned_hash", "pruned_at") VALUES (1,1,'b40e914e-ebd9-42b9-a34f-8103618cb32d','2026-10-25T14:30:58.159Z',0,'7a8f7d91f41a5c8fbbad3e0e5b6fca27bcea0cff4296e094a4e568773d2a69a0',4,5,'ba166ef23562f97966d828979cca997d01d251e27d2a6fc055275d5cec3d9683',0,0,NULL,NULL);
INSERT INTO "_fm_record_id_high_water" ("tbl", "id") VALUES ('Clients',2) ON CONFLICT(tbl) DO UPDATE SET id = max(id, excluded.id);
INSERT INTO "_fm_security_chain_state" ("id", "version", "chain_id", "created_at", "legacy_through", "legacy_count", "genesis_hash", "head_seq", "head_audit_seq", "head_hash") VALUES (1,1,'b8c3a0aa-512b-4cd0-b2c0-443416e20731','2026-10-25T14:30:58.158Z',0,0,'b4ed667d4c30eb3018728df2c1f322c6ff92f7e249c74b509e311389e17a68d0',4,8,'3808861692d53b29af2b510e7aa1b756ddc16db6477785d9c15e26e2e9821576');
INSERT INTO "_fm_sign_in_ledger" ("key", "mark", "gen") VALUES ('','4/4',0);
