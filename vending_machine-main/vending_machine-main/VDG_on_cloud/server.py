# server.py
from flask import Flask, jsonify
import json

app = Flask(__name__)

@app.route('/data', methods=['GET'])
def get_data():
    with open('generated_data.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    return jsonify(data)

@app.route('/')
def index():
    return 'Flask server is running! Use /data to get JSON.'

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
