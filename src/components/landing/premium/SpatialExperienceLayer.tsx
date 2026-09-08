const chapters = [
  ["product-story", "Produto"],
  ["realtime", "Ao vivo"],
  ["insights", "IA"],
  ["capabilities", "Recursos"],
  ["how-it-works", "Instalação"],
  ["pricing", "Planos"],
] as const;

/** Ambient UI for the landing. Product content remains in the page sections. */
export function SpatialExperienceLayer() {
  return (
    <>
      <div className="spatial-cursor" aria-hidden="true">
        <i />
      </div>
      <nav className="spatial-rail" aria-label="Navegação pela apresentação">
        <span className="spatial-rail__track" aria-hidden="true">
          <i />
        </span>
        {chapters.map(([id, label], index) => (
          <a
            href={`#${id}`}
            data-spatial-target={id}
            className={index === 0 ? "is-active" : undefined}
            key={id}
          >
            <b>{String(index + 1).padStart(2, "0")}</b>
            <span>{label}</span>
          </a>
        ))}
      </nav>
      <div className="spatial-edge" aria-hidden="true">
        <span>KUBO / LIVE DATA</span>
        <i />
        <span>SCROLL TO EXPLORE</span>
      </div>
    </>
  );
}
