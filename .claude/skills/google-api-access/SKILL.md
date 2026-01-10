---
name: google-api-access
description: >
  Provides authenticated access to Google APIs via OAuth 2.0. User specifies which API and what data is needed with required parameters. Skill handles authentication, scope management, and token refresh transparently. Returns raw API responses - no data transformation or analysis.
  How it works: User: "Get [data] from [Google API] with [parameters]" -> Skill: Authenticates → Calls API → Returns raw response (or requests clarification) -> User: Processes returned data as needed (search, filter, transform, analyze).
  OAuth 2.0 desktop flow, accumulates scopes, caches tokens.
  APIs with existing scripts: Google Tag Manager: List accounts/containers/workspaces, export/create container configs (tags, triggers, variables, templates).
  Other API: Any Google API can be requested - skill creates access scripts on demand (Analytics, Ads, Search Console, Drive, Sheets, Calendar, Gmail, etc.)
---

## Description


**How it works:**
- User: "Get [data] from [Google API] with [parameters]"
- Skill: Authenticates → Calls API → Returns raw response (or requests clarification)
- User: Processes returned data as needed (search, filter, transform, analyze)

**Auth**: OAuth 2.0 desktop flow, accumulates scopes, caches tokens

**APIs with existing scripts:**
- **Google Tag Manager**: List accounts/containers/workspaces, export/create container configs (tags, triggers, variables, templates)

**Other APIs**: Any Google API can be requested - skill creates access scripts on demand (Analytics, Ads, Search Console, Drive, Sheets, Calendar, Gmail, etc.)

## Core Philosophy

**Return raw API data**: Skill fetches and returns data from Google APIs as requested. NO transformations, filtering, or analysis. Caller handles all data processing.

**Separation of concerns**:
- **Skill does**: OAuth, API calls, return raw responses
- **Skill does NOT**: Search, filter, transform, or analyze returned data
- **Caller does**: Request specific data with parameters, process responses, answer questions

**Generic scripts only**: Create scripts for foundational API access (list, export, create, update, delete). Don't create scripts for specific queries.

**Example**:
- ❌ Don't: `gtm_find_cookiebot.py` (analyzes data)
- ✅ Do: `gtm_export_container.py` (returns raw data)
- ✅ Caller: Uses grep/jq/Python to search exported data

**Look at code**: For implementation details, read the actual script code. This document covers flows and principles, not implementation specifics.

## File Structure

```
.claude/skills/google-api-access/
├── credentials.json       # OAuth client (from GCP Console) - never commit
├── token.pickle           # Access/refresh tokens (auto-generated) - never commit
├── scopes.json            # Scope tracker (auto-managed) - never commit
├── scripts/
│   ├── google_auth.py     # Auth handler
│   └── gtm_*.py           # GTM API scripts
└── .gitignore             # Protects sensitive files
```

**OAuth Config**: Project `internal-294410`, Desktop App, Test user: thomas@9fwr.com

## Authentication Flow

### Smart Scope Accumulation
Scopes **accumulate** (never replace) to minimize re-authentication:
1. Request with new scopes → Load existing from `scopes.json`
2. Merge: `accumulated = existing ∪ requested`
3. Check token has all accumulated scopes
4. If missing scopes or expired → Re-authenticate with accumulated scopes
5. Save updated token and scopes

**Result**: Once broader permissions granted, never re-auth for subsets.

### Error-Driven Flow
API scripts are simple - read `token.pickle`, fail if missing/invalid. When script needs new scope:

```
1. Script fails: "Token missing required scope: tagmanager.edit.containers"
2. Claude updates scopes.json to add the new scope
3. Claude runs google_auth.py (triggers OAuth flow with expanded scopes)
4. Claude re-runs script → succeeds with updated token
```

**Important**: Scripts never handle OAuth - they only read token and fail clearly. Claude must manually update `scopes.json` before running auth.

### Re-authentication Triggers
- No token exists
- Token missing required scopes
- Token expired without refresh token

### Manual Reset
```bash
rm token.pickle && echo '{"requested_scopes":[]}' > scopes.json
```

## Available Scripts

### `scripts/google_auth.py`
Opens browser for OAuth, accumulates scopes, saves token. Run when API scripts fail with auth errors.

### `scripts/gtm_list_accounts.py`
Lists all GTM accounts, containers, and workspaces. Outputs hierarchical text.

### `scripts/gtm_export_container.py <account_id> <container_id> [workspace_id] [output_file]`
Exports complete GTM container config (tags, triggers, variables, templates) to JSON file.

### `scripts/gtm_create_template.py <account_id> <container_id> <workspace_id> <template_file>`
Uploads GTM custom template (.tpl file) to workspace. Requires `tagmanager.edit.containers` scope.

## Creating New Scripts

### When to Create
Only create scripts that provide **foundational API access** for reuse:
- List/export operations for new APIs
- Generic read/write operations
- Scripts that will be base for many queries

**Don't create**: Scripts answering specific questions - use existing scripts + data analysis instead.

### Design Principles
1. **Generic parameters**: IDs, paths, resource names (not hardcoded values)
2. **Simple auth**: Load `token.pickle`, fail if invalid/missing
3. **Structured output**: JSON for data, human-readable for lists
4. **Token-only**: Never handle OAuth flow - let `google_auth.py` do it
5. **Clear errors**: Tell user to run `google_auth.py` when auth fails
6. **Docstring**: Usage, parameters, prerequisites in script header

### Look at Existing Code
See `scripts/gtm_*.py` for examples. Don't replicate patterns here - read the actual code.

## Optimization Guidelines

Scripts can be improved if:
- Simpler implementation found
- Better API methods discovered
- Significantly better error handling
- Change maintains/increases genericness

**Don't**: Create specialized variants or solve specific questions with new scripts.

## Dependencies

```bash
pip install -r requirements.txt
```

Or: `pip install google-auth-oauthlib google-auth-httplib2 google-api-python-client`

## Security

- **credentials.json**: OAuth client ID/secret (sensitive, in .gitignore)
- **token.pickle**: Access/refresh tokens (very sensitive, in .gitignore)
- **scopes.json**: Scope history (tracked, in .gitignore)
- Tokens stored as pickle for simplicity (fine for desktop/testing)
- Never commit any of these files

## Common Google API Scopes

Find scopes in Google API documentation. Examples:
- GTM: `tagmanager.readonly`, `tagmanager.edit.containers`
- Analytics: `analytics.readonly`, `analytics.edit`
- Drive: `drive.readonly`, `drive.file`

Auth system accumulates scopes automatically - request minimal scope first, expand later if needed.
