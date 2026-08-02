// src/app/analysis/page.tsx
import AnalysisClient from '../components/AnalysisClient';

export default function Page() {
  return (
    <main style={{ padding: 20 }}>
      <h1>Auto Analysis (demo)</h1>
      <AnalysisClient />
    </main>
  );
}
