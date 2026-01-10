#!/usr/bin/env python3
"""
List all Google Tag Manager accounts, containers, and workspaces.

This script displays all GTM resources accessible to the authenticated user
in a readable hierarchical format.

Prerequisites:
    Run google_auth.py first to authenticate with required scopes

Usage:
    python gtm_list_accounts.py

Output:
    Formatted list showing:
    - Accounts (with IDs)
    - Containers within each account (with IDs)
    - Workspaces within each container
"""

import sys
import os
import pickle

# Add parent directory to path for imports
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


def list_gtm_resources():
    """List all GTM accounts, containers, and workspaces."""
    creds = load_credentials()

    # Build GTM service
    try:
        service = build('tagmanager', 'v2', credentials=creds)
    except Exception as e:
        print(f"Error building GTM service: {e}")
        print("You may need additional scopes. Run:")
        print("python scripts/google_auth.py")
        sys.exit(1)

    print("Fetching GTM accounts...\n")

    # List accounts
    try:
        accounts = service.accounts().list().execute()
    except Exception as e:
        print(f"Error fetching accounts: {e}")
        print("\nYou may need the tagmanager.readonly scope. Run:")
        print("python scripts/google_auth.py")
        sys.exit(1)

    if 'account' not in accounts:
        print("No GTM accounts found.")
        return

    for account in accounts['account']:
        account_id = account['accountId']
        account_name = account['name']
        account_path = account['path']

        print(f"📊 Account: {account_name}")
        print(f"   ID: {account_id}")
        print(f"   Path: {account_path}")
        print()

        # List containers for this account
        try:
            containers = service.accounts().containers().list(parent=account_path).execute()

            if 'container' not in containers:
                print("   No containers found.")
                print()
                continue

            for container in containers['container']:
                container_id = container['containerId']
                container_name = container['name']
                container_path = container['path']
                public_id = container.get('publicId', 'N/A')

                print(f"   📦 Container: {container_name}")
                print(f"      ID: {container_id}")
                print(f"      Public ID: {public_id}")
                print(f"      Path: {container_path}")

                # List workspaces for this container
                try:
                    workspaces = service.accounts().containers().workspaces().list(
                        parent=container_path
                    ).execute()

                    if 'workspace' in workspaces:
                        print(f"      Workspaces:")
                        for workspace in workspaces['workspace']:
                            workspace_name = workspace['name']
                            workspace_id = workspace['workspaceId']
                            print(f"         • {workspace_name} (ID: {workspace_id})")
                except Exception as e:
                    print(f"      Error listing workspaces: {e}")

                print()

        except Exception as e:
            print(f"   Error listing containers: {e}")
            print()


def main():
    """Main entry point."""
    try:
        list_gtm_resources()
        return 0
    except Exception as e:
        print(f"Error: {e}")
        return 1


if __name__ == '__main__':
    exit(main())
