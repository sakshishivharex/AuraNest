"""Vercel serverless entry point.

Vercel discovers Python functions by their file location, so this file exposes
the Flask app at /api/index. Everything else is routed here by the catch-all
rewrite in vercel.json.
"""

from app import app as flask_app

# Vercel's @vercel/python runtime looks for a module-level `app` WSGI callable.
app = flask_app