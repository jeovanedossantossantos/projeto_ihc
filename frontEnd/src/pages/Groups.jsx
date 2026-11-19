import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Users } from "lucide-react";
import { useData } from "../context/DataContext";
import { EmptyState } from "../components/ui";
import GroupCard from "../components/GroupCard";

const TABS = [
  { key: "ativo", label: "Ativos" },
  { key: "concluido", label: "Concluídos" },
  { key: "arquivado", label: "Arquivados" },
];

export default function Groups() {
  const { groups } = useData();
  const [tab, setTab] = useState("ativo");
  const list = groups.filter((g) => g.status === tab).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const count = (key) => groups.filter((g) => g.status === key).length;

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">Grupos</h1>
        <Link to="/grupos/novo" className="btn btn-primary btn-sm">
          <Plus size={16} aria-hidden="true" /> Novo
        </Link>
      </header>

      <div className="segmented" role="tablist" aria-label="Status dos grupos">
        {TABS.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} className={tab === t.key ? "active" : ""} onClick={() => setTab(t.key)}>
            {t.label}{tab === t.key ? ` · ${count(t.key)}` : ""}
          </button>
        ))}
      </div>

      {list.length ? (
        <div className="groups-grid">
          {list.map((g) => <GroupCard key={g.id} group={g} />)}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title={tab === "ativo" ? "Nenhum grupo ativo" : `Nenhum grupo ${tab === "concluido" ? "concluído" : "arquivado"}`}
          text={tab === "ativo" ? "Crie um grupo para organizar seu próximo trabalho." : undefined}
          action={tab === "ativo" && <Link to="/grupos/novo" className="btn btn-soft btn-sm">Criar grupo</Link>}
        />
      )}

      <Link to="/grupos/novo" className="fab m-only" aria-label="Novo grupo">
        <Plus size={24} />
      </Link>
    </div>
  );
}
