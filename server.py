#!/usr/bin/env python3
import os
import sys
import json
import threading
import webbrowser
import time
import argparse
from flask import Flask, send_from_directory, jsonify, request
from platformdirs import PlatformDirs


APP_NAME = "todo"

# Placeholder – filled after parsing args
TODO_PATH = None

# Where static files live
HERE = os.path.dirname(os.path.realpath(sys.argv[0]))
PUBLIC_DIR = os.path.join(HERE, 'public')

app = Flask(__name__, static_folder=PUBLIC_DIR, static_url_path='')

@app.route('/data/todo.json', methods=['GET'])
def get_todo():
    try:
        # Create file if missing
        if not os.path.exists(TODO_PATH):
            with open(TODO_PATH, 'w', encoding='utf-8') as f:
                json.dump([], f)
        with open(TODO_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return jsonify(data)
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/data/todo.json', methods=['PUT'])
def put_todo():
    try:
        payload = request.get_json(force=True, cache=False)
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

def open_browser(port, host):
    time.sleep(0.5)
    webbrowser.open(f'http://{host}:{port}/')

def main():
    parser = argparse.ArgumentParser(description="Simple TODO app")
    parser.add_argument(
        "file",
        nargs="?",
        help="Where to store the todo JSON file"
    )
    parser.add_argument(
        "-p", "--port",
        type=int,
        default=8000,
        help="Port to run the server on (default: 8000)"
    )
    parser.add_argument(
        "--host", # No -h shortcut, because that is reserved for --help.
        default="localhost",
        help="Host interface to bind to (default: localhost)"
    )
    args = parser.parse_args()

    # Resolve TODO_PATH
    global TODO_PATH
    if args.file:
        TODO_PATH = os.path.abspath(args.file)
        if os.path.isdir(TODO_PATH):
            TODO_PATH = os.path.join(TODO_PATH, "todo.json")
    else:
        DATA_DIR = PlatformDirs(APP_NAME).user_data_dir
        os.makedirs(DATA_DIR, exist_ok=True) # Ensure directory exists
        TODO_PATH = os.path.join(DATA_DIR, "todo.json")

    threading.Thread(target=open_browser, args=(args.port, args.host), daemon=True).start()
    app.run(host=args.host, port=args.port, threaded=True)


if __name__ == "__main__":
    main()
