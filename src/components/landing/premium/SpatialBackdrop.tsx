/** Purely decorative geometry; no product claims or additional content. */
export function SpatialBackdrop() {
  return (
    <div className="spatial-backdrop" aria-hidden="true">
      <div className="spatial-horizon" />
      <div className="spatial-ring spatial-ring--one" />
      <div className="spatial-ring spatial-ring--two" />
      <div className="spatial-cube">
        {["front", "back", "left", "right", "top", "bottom"].map((face) => (
          <i key={face} className={`spatial-cube__${face}`} />
        ))}
      </div>
      <div className="spatial-towers">
        {[42, 68, 52, 90, 74].map((height, i) => (
          <i key={i} style={{ height: `${height}%` }} />
        ))}
      </div>
      <div className="spatial-specks">
        {Array.from({ length: 12 }, (_, i) => (
          <i
            key={i}
            style={{ left: `${(i * 29) % 100}%`, top: `${(i * 17) % 95}%` }}
          />
        ))}
      </div>
    </div>
  );
}
