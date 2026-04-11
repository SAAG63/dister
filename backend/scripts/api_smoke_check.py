#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request


def http_request(
    method: str,
    url: str,
    *,
    json_body: dict | None = None,
    headers: dict[str, str] | None = None,
    timeout: float = 10.0,
) -> tuple[int, dict | str]:
    request_headers = {"Accept": "application/json"}
    if headers:
        request_headers.update(headers)

    data = None
    if json_body is not None:
        data = json.dumps(json_body).encode("utf-8")
        request_headers["Content-Type"] = "application/json"

    request = urllib.request.Request(url, data=data, headers=request_headers, method=method)

    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            raw = response.read().decode("utf-8")
            content_type = response.headers.get("Content-Type", "")
            if "application/json" in content_type:
                return response.status, json.loads(raw)
            return response.status, raw
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode("utf-8", errors="replace")
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError:
            parsed = raw
        return exc.code, parsed


def check_swagger(base_url: str) -> None:
    url = urllib.parse.urljoin(base_url, "/api/docs-json")
    status, body = http_request("GET", url)
    if status != 200:
        raise RuntimeError(f"Swagger check failed: GET {url} returned {status}: {body}")
    if not isinstance(body, dict):
        raise RuntimeError(f"Swagger check failed: expected JSON object, got {type(body).__name__}")

    info = body.get("info", {})
    title = info.get("title")
    paths = body.get("paths", {})
    print(f"[OK] Swagger JSON: {url}")
    print(f"     title={title!r}, paths={len(paths)}")


def graphql_request(base_url: str, query: str, *, token: str | None = None) -> dict:
    url = urllib.parse.urljoin(base_url, "/graphql")
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    status, body = http_request("POST", url, json_body={"query": query}, headers=headers)
    if status != 200:
        raise RuntimeError(f"GraphQL HTTP error: POST {url} returned {status}: {body}")
    if not isinstance(body, dict):
        raise RuntimeError(f"GraphQL error: expected JSON object, got {type(body).__name__}")
    if body.get("errors"):
        raise RuntimeError(f"GraphQL returned errors: {body['errors']}")
    return body["data"]


def check_public_graphql(base_url: str) -> None:
    query = """
    query SmokeUsers {
      users(limit: 3) {
        data {
          id
          username
        }
        hasMore
        nextCursor
      }
    }
    """
    data = graphql_request(base_url, query)
    users = data["users"]["data"]
    print(f"[OK] GraphQL public query: /graphql")
    print(f"     users_returned={len(users)}")


def register_temp_user(base_url: str) -> tuple[str, str]:
    suffix = int(time.time() * 1000)
    username = f"smoke_{suffix}"
    email = f"{username}@example.com"
    password = "SmokeCheck123!"

    url = urllib.parse.urljoin(base_url, "/api/auth/register")
    status, body = http_request(
        "POST",
        url,
        json_body={"username": username, "email": email, "password": password},
    )

    if status != 201:
        raise RuntimeError(f"Temp user registration failed: POST {url} returned {status}: {body}")
    if not isinstance(body, dict) or "token" not in body:
        raise RuntimeError(f"Temp user registration returned unexpected payload: {body}")

    print(f"[OK] Registered temp user: {email}")
    return body["token"], body["refreshToken"]


def check_authed_graphql(base_url: str, token: str) -> None:
    query = """
    query SmokeFeed {
      feed(limit: 3) {
        data {
          id
          content
          author {
            username
          }
        }
        hasMore
      }
    }
    """
    data = graphql_request(base_url, query, token=token)
    posts = data["feed"]["data"]
    print(f"[OK] GraphQL authed query: /graphql")
    print(f"     feed_items={len(posts)}")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Smoke-check Swagger and GraphQL endpoints"
    )
    parser.add_argument(
        "--base-url",
        default="http://localhost:3000",
        help="Base backend URL. Default: http://localhost:3000",
    )
    parser.add_argument(
        "--with-auth",
        action="store_true",
        help="Register a temp user and run an authed GraphQL query",
    )
    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    try:
        check_swagger(args.base_url)
        check_public_graphql(args.base_url)
        if args.with_auth:
            token, _refresh_token = register_temp_user(args.base_url)
            check_authed_graphql(args.base_url, token)
    except Exception as exc:  # noqa: BLE001
        print(f"[FAIL] {exc}", file=sys.stderr)
        return 1

    print("[DONE] All checks passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
