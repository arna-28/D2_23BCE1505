import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
# Import prepared features
from prepare_data import X, y

print("Dataset loaded")
print("Total samples:", X.shape[0])
print("Feature dimension:", X.shape[1])

# Train-test split (stratified to preserve class ratio)
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

print("Training samples:", X_train.shape[0])
print("Testing samples:", X_test.shape[0])

# Random Forest model (balanced for class imbalance)
from sklearn.svm import SVC

model = Pipeline([
    ("scaler", StandardScaler()),
    ("svm", SVC(
        kernel="rbf",
        class_weight="balanced",
        probability=True,
        C=10,
        gamma="scale",
        random_state=42
    ))
])
# Train model
model.fit(X_train, y_train)

# Evaluate
accuracy = model.score(X_test, y_test)
y_probs = model.predict_proba(X_test)[:, 1]
y_pred = (y_probs >= 0.35).astype(int)

print("\n================ MODEL PERFORMANCE ================\n")
print(f"Accuracy: {accuracy:.4f}\n")

print("Classification Report:")
print(
    classification_report(
        y_test,
        y_pred,
        target_names=["Non-Dementia", "Dementia"]
    )
)

print("Confusion Matrix:")
print(confusion_matrix(y_test, y_pred))

# Save model
joblib.dump({
    "model": model,
    "threshold": 0.35
}, "model.pkl")
print("\nModel saved as model.pkl")