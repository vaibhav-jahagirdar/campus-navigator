import joblib
import numpy as np
from sklearn.neighbors import KNeighborsRegressor

# Dummy training data
X = np.random.rand(50, 5)
y = np.random.rand(50, 2) * 10  # coordinates

model = KNeighborsRegressor(n_neighbors=3)
model.fit(X, y)
joblib.dump(model, "model.pkl")
print("✅ Dummy model saved as model.pkl")
