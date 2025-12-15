"use client";
import { useState } from "react";
import { fetchPrediction } from "./utils/fetchPrediction";

export default function IndoorNavPage() {
  const [features, setFeatures] = useState<string>("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handlePredict = async () => {
    setLoading(true);
    try {
      const nums = features.split(",").map((x) => parseFloat(x.trim()));
      const res = await fetchPrediction(nums);
      setResult(res);
    } catch (err: any) {
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Indoor Navigation Prediction</h1>
      <input
        type="text"
        placeholder="Enter 5 features, comma separated"
        className="border p-2 w-full mb-4"
        value={features}
        onChange={(e) => setFeatures(e.target.value)}
      />
      <button
        onClick={handlePredict}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        {loading ? "Predicting..." : "Predict"}
      </button>
      {result && (
        <pre className="bg-gray-100 p-4 mt-4 rounded">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
