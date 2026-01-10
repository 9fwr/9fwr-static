#!/usr/bin/env python3
"""
Manage GTM Tags

Create, update, pause, or delete tags in a GTM workspace.

Usage:
    python gtm_manage_tag.py create <account_id> <container_id> <workspace_id> <tag_name> <tag_type> <trigger_id> [parameters_json]
    python gtm_manage_tag.py pause <account_id> <container_id> <workspace_id> <tag_id>
    python gtm_manage_tag.py unpause <account_id> <container_id> <workspace_id> <tag_id>
    python gtm_manage_tag.py delete <account_id> <container_id> <workspace_id> <tag_id>

Examples:
    # Create tag with custom template
    python gtm_manage_tag.py create 4597289300 137091180 12 "My Tag" "cvt_137091180_26" "2147479572" '[{"type":"template","key":"scriptUrl","value":"/script.js"}]'

    # Pause tag
    python gtm_manage_tag.py pause 4597289300 137091180 12 4

    # Delete tag
    python gtm_manage_tag.py delete 4597289300 137091180 12 4

Prerequisites:
    - Valid token.pickle with tagmanager.edit.containers scope
    - Run google_auth.py if you get auth errors
"""

import sys
import pickle
import json
from pathlib import Path
from googleapiclient.discovery import build

SCRIPT_DIR = Path(__file__).parent
BASE_DIR = SCRIPT_DIR.parent
TOKEN_FILE = BASE_DIR / 'token.pickle'
REQUIRED_SCOPE = 'https://www.googleapis.com/auth/tagmanager.edit.containers'


def get_service():
    """Get authenticated GTM service."""
    if not TOKEN_FILE.exists():
        print(f"Error: Token file not found: {TOKEN_FILE}")
        print(f"Run: python scripts/google_auth.py")
        sys.exit(1)

    with open(TOKEN_FILE, 'rb') as f:
        creds = pickle.load(f)

    if not creds or not creds.valid:
        print("Error: Token is invalid or expired")
        print(f"Run: python scripts/google_auth.py")
        sys.exit(1)

    if REQUIRED_SCOPE not in creds.scopes:
        print(f"Error: Token missing required scope: {REQUIRED_SCOPE}")
        print(f"Current scopes: {creds.scopes}")
        print(f"Run: python scripts/google_auth.py")
        sys.exit(1)

    return build('tagmanager', 'v2', credentials=creds)


def create_tag(service, account_id, container_id, workspace_id, tag_name, tag_type, trigger_ids, parameters=None):
    """Create a new tag."""
    tag_body = {
        'name': tag_name,
        'type': tag_type,
        'firingTriggerId': trigger_ids if isinstance(trigger_ids, list) else [trigger_ids],
        'tagFiringOption': 'oncePerEvent',
        'monitoringMetadata': {'type': 'map'},
        'consentSettings': {'consentStatus': 'notSet'}
    }

    if parameters:
        tag_body['parameter'] = parameters

    workspace_path = f'accounts/{account_id}/containers/{container_id}/workspaces/{workspace_id}'

    print(f"Creating tag '{tag_name}'...")
    print(f"  Type: {tag_type}")
    print(f"  Triggers: {trigger_ids}")

    result = service.accounts().containers().workspaces().tags().create(
        parent=workspace_path,
        body=tag_body
    ).execute()

    print(f"\n✓ Tag created!")
    print(f"  Tag ID: {result.get('tagId')}")
    print(f"  Name: {result.get('name')}")
    return result


def pause_tag(service, account_id, container_id, workspace_id, tag_id, pause=True):
    """Pause or unpause a tag."""
    tag_path = f'accounts/{account_id}/containers/{container_id}/workspaces/{workspace_id}/tags/{tag_id}'

    tag = service.accounts().containers().workspaces().tags().get(path=tag_path).execute()
    tag['paused'] = pause

    action = "Pausing" if pause else "Unpausing"
    print(f"{action} tag '{tag['name']}'...")

    result = service.accounts().containers().workspaces().tags().update(
        path=tag_path,
        body=tag
    ).execute()

    status = "paused" if pause else "active"
    print(f"\n✓ Tag {status}!")
    print(f"  Tag ID: {result.get('tagId')}")
    print(f"  Name: {result.get('name')}")
    return result


def delete_tag(service, account_id, container_id, workspace_id, tag_id):
    """Delete a tag."""
    tag_path = f'accounts/{account_id}/containers/{container_id}/workspaces/{workspace_id}/tags/{tag_id}'

    tag = service.accounts().containers().workspaces().tags().get(path=tag_path).execute()

    print(f"Deleting tag '{tag['name']}'...")

    service.accounts().containers().workspaces().tags().delete(path=tag_path).execute()

    print(f"\n✓ Tag deleted!")
    print(f"  Tag ID: {tag_id}")
    print(f"  Name: {tag['name']}")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    command = sys.argv[1].lower()
    service = get_service()

    if command == 'create':
        if len(sys.argv) < 8:
            print("Usage: gtm_manage_tag.py create <account_id> <container_id> <workspace_id> <tag_name> <tag_type> <trigger_id> [parameters_json]")
            sys.exit(1)

        account_id = sys.argv[2]
        container_id = sys.argv[3]
        workspace_id = sys.argv[4]
        tag_name = sys.argv[5]
        tag_type = sys.argv[6]
        trigger_id = sys.argv[7]
        parameters = json.loads(sys.argv[8]) if len(sys.argv) > 8 else None

        create_tag(service, account_id, container_id, workspace_id, tag_name, tag_type, trigger_id, parameters)

    elif command in ['pause', 'unpause']:
        if len(sys.argv) != 6:
            print("Usage: gtm_manage_tag.py pause/unpause <account_id> <container_id> <workspace_id> <tag_id>")
            sys.exit(1)

        account_id = sys.argv[2]
        container_id = sys.argv[3]
        workspace_id = sys.argv[4]
        tag_id = sys.argv[5]

        pause_tag(service, account_id, container_id, workspace_id, tag_id, pause=(command == 'pause'))

    elif command == 'delete':
        if len(sys.argv) != 6:
            print("Usage: gtm_manage_tag.py delete <account_id> <container_id> <workspace_id> <tag_id>")
            sys.exit(1)

        account_id = sys.argv[2]
        container_id = sys.argv[3]
        workspace_id = sys.argv[4]
        tag_id = sys.argv[5]

        delete_tag(service, account_id, container_id, workspace_id, tag_id)

    else:
        print(f"Unknown command: {command}")
        print(__doc__)
        sys.exit(1)


if __name__ == '__main__':
    main()
