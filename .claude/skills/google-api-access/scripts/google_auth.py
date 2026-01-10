#!/usr/bin/env python3
"""
Generic Google OAuth 2.0 authentication helper with smart scope management.

This module provides reusable authentication for Google APIs with intelligent
scope handling:
- Accumulates scopes over time (never removes previously granted scopes)
- Only re-authenticates when new scopes are needed
- Tracks scope history in scopes.json
- Stores credentials and tokens within skill directory

Usage as module:
    from scripts.google_auth import get_credentials
    creds = get_credentials(['https://www.googleapis.com/auth/tagmanager.readonly'])

Usage standalone (test auth):
    python google_auth.py [scope1] [scope2] ...
"""

import os
import sys
import json
import pickle
from datetime import datetime
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request

# All paths relative to skill directory
SKILL_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CREDENTIALS_FILE = os.path.join(SKILL_DIR, 'credentials.json')
TOKEN_FILE = os.path.join(SKILL_DIR, 'token.pickle')
SCOPES_FILE = os.path.join(SKILL_DIR, 'scopes.json')


def load_scopes_config():
    """Load the scopes configuration file."""
    import json
    try:
        with open(SCOPES_FILE, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return {'requested_scopes': [], 'last_updated': None}


def save_scopes_config(scopes_config):
    """Save the scopes configuration file."""
    import json
    from datetime import datetime
    scopes_config['last_updated'] = datetime.utcnow().isoformat() + 'Z'
    with open(SCOPES_FILE, 'w') as f:
        json.dump(scopes_config, f, indent=2)


def get_accumulated_scopes(new_scopes):
    """
    Get accumulated scopes (existing + new).

    This ensures we always add scopes rather than replace them,
    avoiding the need to re-authenticate frequently.

    Args:
        new_scopes: List of newly requested scopes

    Returns:
        List of all scopes (old + new, deduplicated)
    """
    config = load_scopes_config()
    existing_scopes = set(config.get('requested_scopes', []))
    new_scopes_set = set(new_scopes)

    accumulated = existing_scopes | new_scopes_set

    # Update config if new scopes were added
    if new_scopes_set - existing_scopes:
        config['requested_scopes'] = sorted(list(accumulated))
        save_scopes_config(config)
        print(f"Added new scopes: {', '.join(new_scopes_set - existing_scopes)}")

    return sorted(list(accumulated))


def token_has_required_scopes(creds, required_scopes):
    """
    Check if current token has all required scopes.

    Args:
        creds: Credentials object
        required_scopes: List of required scopes

    Returns:
        Boolean indicating if token has all required scopes
    """
    if not creds or not hasattr(creds, 'scopes'):
        return False

    current_scopes = set(creds.scopes) if creds.scopes else set()
    required_scopes_set = set(required_scopes)

    return required_scopes_set.issubset(current_scopes)


def get_credentials(scopes):
    """
    Get authenticated credentials for Google API access with smart scope handling.

    Flow:
    1. Check if token file exists and load it
    2. Check if token has all required scopes
    3. If missing scopes, accumulate old + new scopes and re-authenticate
    4. If token is expired but has right scopes, refresh it
    5. If no valid token exists, run OAuth flow with accumulated scopes
    6. Save token for future use

    Args:
        scopes: List of OAuth scopes needed for this request

    Returns:
        Authenticated credentials object

    Raises:
        FileNotFoundError: If credentials file doesn't exist
    """
    import pickle

    if not os.path.exists(CREDENTIALS_FILE):
        raise FileNotFoundError(
            f"Credentials file not found: {CREDENTIALS_FILE}\n"
            f"Make sure credentials.json exists in the skill directory."
        )

    # Get accumulated scopes (existing + new)
    accumulated_scopes = get_accumulated_scopes(scopes)

    creds = None
    need_reauth = False

    # Load existing token if available
    if os.path.exists(TOKEN_FILE):
        with open(TOKEN_FILE, 'rb') as token:
            creds = pickle.load(token)

        # Check if token has all required scopes
        if not token_has_required_scopes(creds, accumulated_scopes):
            print("Token missing required scopes. Re-authenticating with expanded scope...")
            need_reauth = True
            creds = None

    # Handle authentication
    if not creds or not creds.valid or need_reauth:
        if creds and creds.expired and creds.refresh_token and not need_reauth:
            print("Refreshing expired token...")
            from google.auth.transport.requests import Request
            creds.refresh(Request())
        else:
            print("Starting OAuth flow...")
            print(f"Requesting scopes: {', '.join(accumulated_scopes)}")
            print("A browser window will open for authentication.")
            from google_auth_oauthlib.flow import InstalledAppFlow
            flow = InstalledAppFlow.from_client_secrets_file(
                CREDENTIALS_FILE,
                accumulated_scopes
            )
            creds = flow.run_local_server(port=0)

        # Save the credentials for the next run
        with open(TOKEN_FILE, 'wb') as token:
            pickle.dump(creds, token)
        print(f"✓ Token saved to {TOKEN_FILE}")

    return creds


def main():
    """Test authentication with GTM read-only scope."""
    print("=" * 70)
    print("Google API Authentication Test")
    print("=" * 70)
    print()
    print(f"Credentials: {CREDENTIALS_FILE}")
    print(f"Token: {TOKEN_FILE}")
    print(f"Scopes config: {SCOPES_FILE}")
    print()

    # Load current scope configuration
    import json
    config = load_scopes_config()
    if config.get('requested_scopes'):
        print("Previously requested scopes:")
        for scope in config['requested_scopes']:
            print(f"  • {scope}")
        print()

    # Test with GTM readonly scope
    print("Testing with: https://www.googleapis.com/auth/tagmanager.readonly")
    print()

    scopes = ['https://www.googleapis.com/auth/tagmanager.readonly']

    try:
        creds = get_credentials(scopes)
        print()
        print("=" * 70)
        print("✓ Authentication successful!")
        print("=" * 70)
        print()
        print(f"Token valid: {creds.valid}")
        print(f"Token scopes: {', '.join(creds.scopes) if creds.scopes else 'N/A'}")
        print()
        print("You can now use this token with Google API scripts.")
    except Exception as e:
        print(f"✗ Authentication failed: {e}")
        import traceback
        traceback.print_exc()
        return 1

    return 0


if __name__ == '__main__':
    exit(main())
