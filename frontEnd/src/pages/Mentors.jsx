import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowUpDown, LayoutGrid, List, Search, SearchX, SlidersHorizontal, Star } from "lucide-react";
import { MENTORS, SUBJECTS, SUBJECT_COLORS } from "../data/mock";
import { Avatar, EmptyState, Sheet, Tag, useDismiss, useIsDesktop } from "../components/ui";

const SORTS = {
  rating: { label: "Mais avaliados", fn: (a, b) => b.rating - a.rating },
  sessions: { label: "Mais mentorias", fn: (a, b) => b.sessions - a.sessions },
  price: { label: "Menor preço", fn: (a, b) => a.price - b.price },
};

const EMPTY_FILTERS = { minRating: 0, modes: [], availability: [], maxPrice: 40, institution: "" };

const normalize = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function MentorRating({ mentor }) {
  return (
    <span className="rating" aria-label={`Nota ${mentor.rating.toFixed(1)}, ${mentor.reviewsCount} avaliações`}>
      <span aria-hidden="true">★ {mentor.rating.toFixed(1)} ({mentor.reviewsCount})</span>
    </span>
  );
}

function MentorTags({ mentor, max = 2 }) {
  return (
    <div className="tags">
      {mentor.subjects.slice(0, max).map((s) => (
        <Tag key={s} tone={SUBJECT_COLORS[s] || "indigo"}>{s}</Tag>
      ))}
    </div>
  );
}

function MentorListCard({ mentor }) {
  const navigate = useNavigate();
  return (
    <article className="card mentor-card">
      <Avatar name={mentor.name} size={48} tone={mentor.color} online={mentor.online} />
      <div className="grow min0">
        <div className="mentor-top">
          <h3><Link to={`/mentores/${mentor.id}`} className="stretched">{mentor.name}</Link></h3>
        </div>
        <p className="muted small">{mentor.title}</p>
        <MentorRating mentor={mentor} />
        <div className="mentor-bottom">
          <MentorTags mentor={mentor} />
          <button className="btn btn-primary btn-sm raise" onClick={() => navigate(`/mentores/${mentor.id}/agendar`)}>
            Agendar
          </button>
        </div>
      </div>
    </article>
  );
}

function MentorGridCard({ mentor }) {
  const navigate = useNavigate();
  return (
    <article className="card mentor-grid-card">
      <div className={`mentor-banner tone-${mentor.color}`} aria-hidden="true" />
      <Avatar name={mentor.name} size={64} tone={mentor.color} solid online={mentor.online} className="ringed" />
      <h3><Link to={`/mentores/${mentor.id}`} className="stretched">{mentor.name}</Link></h3>
      <p className="muted small">{mentor.title}</p>
      <MentorRating mentor={mentor} />
      <p className="small muted">{mentor.price ? `R$ ${mentor.price}/h` : "Gratuito"} · {mentor.institution}</p>
      <MentorTags mentor={mentor} />
      <button className="btn btn-primary btn-sm full raise" onClick={() => navigate(`/mentores/${mentor.id}/agendar`)}>
        Agendar mentoria
      </button>
    </article>
  );
}

function FilterPanel({ subject, onSubject, draft, setDraft, onApply, onClear }) {
  const toggle = (key, value) =>
    setDraft((d) => ({ ...d, [key]: d[key].includes(value) ? d[key].filter((v) => v !== value) : [...d[key], value] }));
  return (
    <form
      className="filters"
      aria-label="Filtros"
      onSubmit={(e) => {
        e.preventDefault();
        onApply();
      }}
    >
      <div className="section-row">
        <h2 className="h4">Filtros</h2>
        <button type="button" className="link-sm" onClick={onClear}>Limpar</button>
      </div>

      <label className="field">
        <span className="overline">Matéria</span>
        <select value={subject} onChange={(e) => onSubject(e.target.value)}>
          <option value="Todos">Todas</option>
          {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
        </select>
      </label>

      <fieldset>
        <legend className="overline">Avaliação mínima</legend>
        <div className="star-input" role="radiogroup" aria-label="Avaliação mínima">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              type="button"
              key={n}
              role="radio"
              aria-checked={draft.minRating === n}
              aria-label={`${n} estrela${n > 1 ? "s" : ""} ou mais`}
              className={n <= draft.minRating ? "on" : ""}
              onClick={() => setDraft((d) => ({ ...d, minRating: d.minRating === n ? 0 : n }))}
            >
              <Star size={18} fill="currentColor" aria-hidden="true" />
            </button>
          ))}
          <span className="small muted">{draft.minRating ? `${draft.minRating}.0+` : "Qualquer"}</span>
        </div>
      </fieldset>

      <fieldset>
        <legend className="overline">Modalidade</legend>
        {[["online", "Online"], ["presencial", "Presencial"]].map(([v, l]) => (
          <label key={v} className="check">
            <input type="checkbox" checked={draft.modes.includes(v)} onChange={() => toggle("modes", v)} /> {l}
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend className="overline">Disponibilidade</legend>
        {[["hoje", "Hoje"], ["fds", "Fim de semana"]].map(([v, l]) => (
          <label key={v} className="check">
            <input type="checkbox" checked={draft.availability.includes(v)} onChange={() => toggle("availability", v)} /> {l}
          </label>
        ))}
      </fieldset>

      <label className="field">
        <span className="overline">Preço máximo</span>
        <input
          type="range"
          min={0}
          max={40}
          step={5}
          value={draft.maxPrice}
          onChange={(e) => setDraft((d) => ({ ...d, maxPrice: Number(e.target.value) }))}
          aria-valuetext={draft.maxPrice ? `Até R$ ${draft.maxPrice} por hora` : "Somente gratuitos"}
        />
        <small className="muted">{draft.maxPrice ? `Gratuito até R$ ${draft.maxPrice}/h` : "Somente gratuitos"}</small>
      </label>

      <label className="field">
        <span className="overline">Instituição</span>
        <input placeholder="Ex.: UFPE" value={draft.institution} onChange={(e) => setDraft((d) => ({ ...d, institution: e.target.value }))} />
      </label>

      <button className="btn btn-primary">Aplicar filtros</button>
    </form>
  );
}

export default function Mentors() {
  const isDesktop = useIsDesktop();
  const [params, setParams] = useSearchParams();
  const query = params.get("q") || "";
  const subject = params.get("materia") || "Todos";
  const [sort, setSort] = useState("rating");
  const [showSort, setShowSort] = useState(false);
  const [view, setView] = useState("grade");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const sortRef = useDismiss(showSort, () => setShowSort(false));

  const update = (key, value) => {
    const next = new URLSearchParams(params);
    if (value && value !== "Todos") next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const list = useMemo(() => {
    const q = normalize(query.trim());
    const inst = normalize(filters.institution.trim());
    return MENTORS.filter((m) => subject === "Todos" || m.subjects.includes(subject))
      .filter((m) => !q || normalize([m.name, m.title, ...m.subjects].join(" ")).includes(q))
      .filter((m) => m.rating >= filters.minRating)
      .filter((m) => !filters.modes.length || filters.modes.some((x) => m.modes.includes(x)))
      .filter((m) => !filters.availability.includes("hoje") || m.availableToday)
      .filter((m) => !filters.availability.includes("fds") || m.weekend)
      .filter((m) => m.price <= filters.maxPrice)
      .filter((m) => !inst || normalize(m.institution).includes(inst))
      .sort(SORTS[sort].fn);
  }, [query, subject, sort, filters]);

  const activeFilterCount =
    (filters.minRating ? 1 : 0) + filters.modes.length + filters.availability.length + (filters.maxPrice < 40 ? 1 : 0) + (filters.institution ? 1 : 0);
  const clear = () => {
    setDraft(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
    setParams({}, { replace: true });
  };

  const panel = (
    <FilterPanel
      subject={subject}
      onSubject={(s) => update("materia", s)}
      draft={draft}
      setDraft={setDraft}
      onApply={() => {
        setFilters(draft);
        setFiltersOpen(false);
      }}
      onClear={clear}
    />
  );

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">
            <span className="m-only">Mentores</span>
            <span className="d-only">Encontrar mentores</span>
          </h1>
          <p className="muted small d-only">
            <strong>{list.length} mentores</strong> disponíveis para sua busca
          </p>
        </div>
        <button className="icon-btn bordered m-only" aria-label={`Filtros${activeFilterCount ? ` (${activeFilterCount} ativos)` : ""}`} onClick={() => setFiltersOpen(true)}>
          <SlidersHorizontal size={18} />
          {activeFilterCount > 0 && <span className="badge-dot" aria-hidden="true" />}
        </button>
      </header>

      <div className="m-only stack-16">
        <div className="search">
          <Search size={18} aria-hidden="true" />
          <input placeholder="Cálculo, física, programação…" value={query} onChange={(e) => update("q", e.target.value)} aria-label="Buscar matéria ou assunto" />
        </div>
        <div className="chips" role="group" aria-label="Filtrar por matéria">
          {["Todos", ...SUBJECTS].map((s) => (
            <button key={s} aria-pressed={subject === s} className={`chip ${subject === s ? "active" : ""}`} onClick={() => update("materia", s)}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="mentors-layout">
        {isDesktop && panel}

        <div className="mentors-results">
          <div className="list-meta">
            <span className="m-only">{list.length} mentor{list.length === 1 ? "" : "es"} encontrado{list.length === 1 ? "" : "s"}</span>
            <div className="pop-wrap" ref={sortRef}>
              <button className="sort-btn" onClick={() => setShowSort((s) => !s)} aria-expanded={showSort} aria-haspopup="menu">
                <span className="muted">Ordenar:</span> {SORTS[sort].label} <ArrowUpDown size={13} aria-hidden="true" />
              </button>
              {showSort && (
                <div className="popover menu" role="menu">
                  {Object.entries(SORTS).map(([key, s]) => (
                    <button key={key} role="menuitemradio" aria-checked={sort === key} className={sort === key ? "active" : ""} onClick={() => { setSort(key); setShowSort(false); }}>
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className="btn btn-secondary-neutral btn-sm d-only" onClick={() => setView((v) => (v === "grade" ? "lista" : "grade"))}>
              {view === "grade" ? <><List size={15} /> Lista</> : <><LayoutGrid size={15} /> Grade</>}
            </button>
          </div>

          {list.length ? (
            isDesktop && view === "grade" ? (
              <div className="mentor-grid">{list.map((m) => <MentorGridCard key={m.id} mentor={m} />)}</div>
            ) : (
              <div className="stack">{list.map((m) => <MentorListCard key={m.id} mentor={m} />)}</div>
            )
          ) : (
            <EmptyState
              icon={SearchX}
              title="Nenhum mentor encontrado"
              text="Tente outra matéria ou limpe os filtros."
              action={<button className="btn btn-soft btn-sm" onClick={clear}>Limpar filtros</button>}
            />
          )}
        </div>
      </div>

      {!isDesktop && (
        <Sheet open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filtros">
          {panel}
        </Sheet>
      )}
    </div>
  );
}
