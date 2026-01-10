#!/usr/bin/env python3
"""
Export complete GTM container configuration to JSON.

This script exports all tags, triggers, variables, and templates from a
specified GTM container. Output can be saved to a file for analysis or backup.

Prerequisites:
    Run google_auth.py first to authenticate with required scopes

Usage:
    python gtm_export_container.py <account_id> <container_id> [workspace_id] [output_file]

Arguments:
    account_id: GTM account ID (get from gtm_list_accounts.py)
    container_id: GTM container ID (get from gtm_list_accounts.py)
    workspace_id: Optional workspace ID (default: 1 for default workspace)
    output_file: Optional output JSON file (default: container_<id>.json)

Example:
    python gtm_export_container.py 123456 7890
    python gtm_export_container.py 123456 7890 5 my_container.json
"""

import sys
import os
import json
import pickle

# Paths relative to skill directory
SKILL_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TOKEN_FILE = os.path.join(SKILL_DIR, 'token.pickle')

from googleapiclient.discovery import build


def load_credentials():
    """Load credentials from token file."""
    if not os.path.exists(TOKEN_FILE):
        print(f"Error: No token file found at {TOKEN_FILE}")
        print("Run: python scripts/google_auth.py")
        print("Required scope: https://www.googleapis.com/auth/tagmanager.readonly")
        sys.exit(1)

    try:
        with open(TOKEN_FILE, 'rb') as token:
            creds = pickle.load(token)

        if not creds.valid:
            print("Error: Token is invalid or expired")
            print("Run: python scripts/google_auth.py")
            sys.exit(1)

        return creds
    except Exception as e:
        print(f"Error loading credentials: {e}")
        print("Run: python scripts/google_auth.py")
        sys.exit(1)


def export_container(account_id, container_id, workspace_id='1', output_file=None):
    """Export complete GTM container configuration."""
    creds = load_credentials()

    # Build GTM service
    try:
        service = build('tagmanager', 'v2', credentials=creds)
    except Exception as e:
        print(f"Error building GTM service: {e}")
        print("Run: python scripts/google_auth.py")
        sys.exit(1)

    # Construct container path
    container_path = f"accounts/{account_id}/containers/{container_id}"
    workspace_path = f"{container_path}/workspaces/{workspace_id}"

    print(f"Exporting container: {container_path}")
    print(f"Workspace: {workspace_id}")
    print()

    # Get container info
    try:
        container = service.accounts().containers().get(path=container_path).execute()
        print(f"Container name: {container['name']}")
        print(f"Public ID: {container.get('publicId', 'N/A')}")
        print()
    except Exception as e:
        print(f"Error fetching container: {e}")
        print("\nYou may need the tagmanager.readonly scope. Run:")
        print("python scripts/google_auth.py")
        return 1

    export_data = {
        'container': container,
        'workspace_id': workspace_id,
        'tags': [],
        'triggers': [],
        'variables': [],
        'templates': [],
        'built_in_variables': []
    }

    # Export tags
    try:
        print("Fetching tags...")
        tags = service.accounts().containers().workspaces().tags().list(
            parent=workspace_path
        ).execute()
        if 'tag' in tags:
            export_data['tags'] = tags['tag']
            print(f"  Found {len(tags['tag'])} tags")
    except Exception as e:
        print(f"  Error: {e}")

    # Export triggers
    try:
        print("Fetching triggers...")
        triggers = service.accounts().containers().workspaces().triggers().list(
            parent=workspace_path
        ).execute()
        if 'trigger' in triggers:
            export_data['triggers'] = triggers['trigger']
            print(f"  Found {len(triggers['trigger'])} triggers")
    except Exception as e:
        print(f"  Error: {e}")

    # Export variables
    try:
        print("Fetching variables...")
        variables = service.accounts().containers().workspaces().variables().list(
            parent=workspace_path
        ).execute()
        if 'variable' in variables:
            export_data['variables'] = variables['variable']
            print(f"  Found {len(variables['variable'])} variables")
    except Exception as e:
        print(f"  Error: {e}")

    # Export custom templates
    try:
        print("Fetching custom templates...")
        templates = service.accounts().containers().workspaces().templates().list(
            parent=workspace_path
        ).execute()
        if 'template' in templates:
            export_data['templates'] = templates['template']
            print(f"  Found {len(templates['template'])} custom templates")
    except Exception as e:
        print(f"  Error: {e}")

    # Export built-in variables
    try:
        print("Fetching built-in variables...")
        built_in_vars = service.accounts().containers().workspaces().built_in_variables().list(
            parent=workspace_path
        ).execute()
        if 'builtInVariable' in built_in_vars:
            export_data['built_in_variables'] = built_in_vars['builtInVariable']
            print(f"  Found {len(built_in_vars['builtInVariable'])} built-in variables")
    except Exception as e:
        print(f"  Error: {e}")

    # Determine output file
    if not output_file:
        output_file = f"container_{container_id}.json"

    # Write to file
    with open(output_file, 'w') as f:
        json.dump(export_data, f, indent=2)

    print()
    print(f"✓ Export complete: {output_file}")
    print(f"  File size: {os.path.getsize(output_file)} bytes")

    return 0


def main():
    """Main entry point."""
    if len(sys.argv) < 3:
        print(__doc__)
        return 1

    account_id = sys.argv[1]
    container_id = sys.argv[2]

    # Parse optional arguments
    workspace_id = '1'
    output_file = None

    if len(sys.argv) > 3:
        # Could be workspace_id or output_file
        arg3 = sys.argv[3]
        if arg3.isdigit():
            workspace_id = arg3
            if len(sys.argv) > 4:
                output_file = sys.argv[4]
        else:
            output_file = arg3

    try:
        return export_container(account_id, container_id, workspace_id, output_file)
    except Exception as e:
        print(f"Error: {e}")
        return 1


if __name__ == '__main__':
    exit(main())
