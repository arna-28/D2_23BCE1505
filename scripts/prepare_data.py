import os
import numpy as np
from extract_features import extract_features

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")

X, y = [], []

for label_name in ["non_dementia", "dementia"]:
    label = 1 if label_name == "dementia" else 0
    label_path = os.path.join(DATA_DIR, label_name)

    print("Reading:", label_path)

    for person in os.listdir(label_path):
        person_path = os.path.join(label_path, person)

        if not os.path.isdir(person_path):
            continue

        for file in os.listdir(person_path):
            if file.lower().endswith(".wav"):
                file_path = os.path.join(person_path, file)
                try:
                    features = extract_features(file_path)
                    X.append(features)
                    y.append(label)
                except Exception as e:
                    print("Error:", file_path, e)

X = np.array(X)
y = np.array(y)

print("Total samples:", len(X))
print("Feature shape:", X.shape)

__all__ = ["X", "y"]

