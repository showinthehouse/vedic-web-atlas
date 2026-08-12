type AshtakavargaScore = { sign: string; signIndex: number; points: number };

const shortSigns = ["Ar", "Ta", "Ge", "Ca", "Le", "Vi", "Li", "Sc", "Sg", "Cp", "Aq", "Pi"];

export function AshtakavargaPanel({ scores }: { scores: AshtakavargaScore[] }) {
  const highest = Math.max(...scores.map(score => score.points), 1);
  return (
    <div className="ashtaka-panel">
      <div className="dasa-intro"><span className="section-tag">ASHTAKAVARGA / SARVA</span><h3>Sarvashtakavarga</h3><p>将七曜与 Lagna 的贡献汇总到十二个 Rasi。该视图显示每个星座的真实总 bindu，不包含解释性断言。</p></div>
      <div className="ashtaka-grid">
        {scores.map(score => <div className="ashtaka-card" key={score.signIndex}><span>{shortSigns[score.signIndex]} · {score.sign}</span><b>{score.points}</b><i><em style={{ height: `${score.points / highest * 100}%` }} /></i></div>)}
      </div>
    </div>
  );
}
