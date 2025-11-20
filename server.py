#!/usr/bin/env python3
import os
import sys
import json
import threading
import webbrowser
import time
from flask import Flask, send_from_directory, jsonify, request
from platformdirs import PlatformDirs

APP_NAME = "todo"
dirs = PlatformDirs(APP_NAME)

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000

# Where static files live (as in your original project)
HERE = os.path.dirname(os.path.realpath(sys.argv[0]))
PUBLIC_DIR = os.path.join(HERE, 'public')

# Standard user data directory (e.g. ~/.local/share/mytodoapp on Linux)
DATA_DIR = dirs.user_data_dir
os.makedirs(PUBLIC_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)

TODO_PATH = os.path.join(DATA_DIR, 'todo.json')

# Create file if missing
if not os.path.exists(TODO_PATH):
    with open(TODO_PATH, 'w', encoding='utf-8') as f:
        json.dump([], f)

app = Flask(__name__, static_folder=PUBLIC_DIR, static_url_path='')

@app.route('/data/todo.json', methods=['GET'])
def get_todo():
    try:
        with open(TODO_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return jsonify(data)
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/data/todo.json', methods=['PATCH'])
def patch_todo():
    try:
        payload = request.get_json(force=True)
        if not isinstance(payload, list):
            raise ValueError('Expected JSON array')

        tmp_path = TODO_PATH + '.tmp'
        with open(tmp_path, 'w', encoding='utf-8') as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)
        os.replace(tmp_path, TODO_PATH)

        return jsonify({'status': 'ok'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 400

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_static(path):
    if path and os.path.exists(os.path.join(PUBLIC_DIR, path)):
        return send_from_directory(PUBLIC_DIR, path)
    else:
        return send_from_directory(PUBLIC_DIR, 'index.html')

def open_browser():
    time.sleep(0.5)
    webbrowser.open(f'http://localhost:{PORT}/')

if __name__ == '__main__':
    threading.Thread(target=open_browser, daemon=True).start()
    app.run(host='127.0.0.1', port=PORT, threaded=True)
