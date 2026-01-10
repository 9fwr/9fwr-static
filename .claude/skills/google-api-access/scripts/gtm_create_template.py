#!/usr/bin/env python3
"""
Upload/Create GTM Custom Template

Uploads a custom template (.tpl file) to a GTM workspace.

Usage:
    python gtm_create_template.py <account_id> <container_id> <workspace_id> <template_file>

Example:
    python gtm_create_template.py 4597289300 137091180 12 template.tpl

Prerequisites:
    - Valid token.pickle with tagmanager.edit.containers scope
    - Run google_auth.py if you get auth errors
"""

import sys
import pickle
import re
import json
from pathlib import Path
from googleapiclient.discovery import build

SCRIPT_DIR = Path(__file__).parent
BASE_DIR = SCRIPT_DIR.parent
TOKEN_FILE = BASE_DIR / 'token.pickle'

REQUIRED_SCOPE = 'https://www.googleapis.com/auth/tagmanager.edit.containers'


def parse_tpl_file(tpl_path):
    """Parse GTM .tpl file into component sections."""
    content = Path(tpl_path).read_text()

    sections = {
        'info': '',
        'parameters': '',
        'code': '',
        'permissions': '',
        'tests': '',
        'notes': ''
    }

    # Extract sections using regex
    info_match = re.search(r'___INFO___\s*\n(.*?)\n\n___', content, re.DOTALL)
    if info_match:
        sections['info'] = info_match.group(1).strip()

    params_match = re.search(r'___TEMPLATE_PARAMETERS___\s*\n(.*?)\n\n___', content, re.DOTALL)
    if params_match:
        sections['parameters'] = params_match.group(1).strip()

    code_match = re.search(r'___SANDBOXED_JS_FOR_WEB_TEMPLATE___\s*\n(.*?)\n\n___', content, re.DOTALL)
    if code_match:
        sections['code'] = code_match.group(1).strip()

    perms_match = re.search(r'___WEB_PERMISSIONS___\s*\n(.*?)\n\n___', content, re.DOTALL)
    if perms_match:
        sections['permissions'] = perms_match.group(1).strip()

    tests_match = re.search(r'___TESTS___\s*\n(.*?)\n\n___', content, re.DOTALL)
    if tests_match:
        sections['tests'] = tests_match.group(1).strip()

    notes_match = re.search(r'___NOTES___\s*\n(.*?)$', content, re.DOTALL)
    if notes_match:
        sections['notes'] = notes_match.group(1).strip()

    return sections


def create_template(service, account_id, container_id, workspace_id, tpl_file):
    """Create a custom template in GTM workspace."""

    print(f"Parsing template file: {tpl_file}")
    sections = parse_tpl_file(tpl_file)

    # Parse info section as JSON
    info = json.loads(sections['info'])

    # Build template body - reconstruct full .tpl format
    template_body = {
        'name': info['displayName'],
        'templateData': (
            '___INFO___\n\n' + sections['info'] + '\n\n\n' +
            '___TEMPLATE_PARAMETERS___\n\n' + sections['parameters'] + '\n\n\n' +
            '___SANDBOXED_JS_FOR_WEB_TEMPLATE___\n\n' + sections['code'] + '\n\n\n' +
            '___WEB_PERMISSIONS___\n\n' + sections['permissions'] + '\n\n\n' +
            '___TESTS___\n\n' + sections['tests'] + '\n\n\n' +
            '___NOTES___\n\n' + sections['notes']
        )
    }

    workspace_path = f'accounts/{account_id}/containers/{container_id}/workspaces/{workspace_id}'

    print(f"Creating template '{info['displayName']}' in workspace {workspace_id}...")

    result = service.accounts().containers().workspaces().templates().create(
        parent=workspace_path,
        body=template_body
    ).execute()

    print(f"\n✓ Template created successfully!")
    print(f"  Template ID: {result.get('templateId')}")
    print(f"  Name: {result.get('name')}")
    print(f"  Path: {result.get('path')}")

    return result


def main():
    if len(sys.argv) != 5:
        print(__doc__)
        sys.exit(1)

    account_id = sys.argv[1]
    container_id = sys.argv[2]
    workspace_id = sys.argv[3]
    tpl_file = sys.argv[4]

    if not Path(tpl_file).exists():
        print(f"Error: Template file not found: {tpl_file}")
        sys.exit(1)

    # Load token
    if not TOKEN_FILE.exists():
        print(f"Error: Token file not found: {TOKEN_FILE}")
        print(f"Run: python scripts/google_auth.py")
        sys.exit(1)

    with open(TOKEN_FILE, 'rb') as f:
        creds = pickle.load(f)

    # Check if token is valid
    if not creds or not creds.valid:
        print("Error: Token is invalid or expired")
        print(f"Run: python scripts/google_auth.py")
        sys.exit(1)

    # Check if token has required scope
    if REQUIRED_SCOPE not in creds.scopes:
        print(f"Error: Token missing required scope: {REQUIRED_SCOPE}")
        print(f"Current scopes: {creds.scopes}")
        print(f"Run: python scripts/google_auth.py")
        sys.exit(1)

    # Build service
    service = build('tagmanager', 'v2', credentials=creds)

    # Create template
    create_template(service, account_id, container_id, workspace_id, tpl_file)


if __name__ == '__main__':
    main()
