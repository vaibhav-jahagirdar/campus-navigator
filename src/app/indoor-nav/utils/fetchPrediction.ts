export async function fetchPrediction(features: number[]) {
  const res = await fetch("http://localhost:8002/api/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ features }),
  });
  if (!res.ok) throw new Error(`Server error: ${res.status}`);
  return res.json();
}
