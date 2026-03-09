# storage.py
import csv
import json
from datetime import datetime

class DataStorage:
    @staticmethod
    def save_csv(data, filename="generate_data.csv"):
        with open(filename, 'a', newline='') as f:
            writer = csv.writer(f)
            writer.writerow([
                data['timestamp'],
                data['device_id'],
                data['product'],
                data['sales'],
                data['traffic'],
                data['time']
            ])

    @staticmethod
    def save_json(data, filename="log.json"):
        with open(filename, 'a') as f:
            f.write(json.dumps(data) + "\n")