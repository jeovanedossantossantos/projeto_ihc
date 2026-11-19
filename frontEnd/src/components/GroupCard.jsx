import { Link } from "react-router-dom";
import { AvatarStack, DueBadge, ProgressBar, dueTone } from "./ui";
import { groupProgress, remainingTasks } from "../utils";

export default function GroupCard({ group, variant = "full" }) {
  const progress = groupProgress(group);
  const active = group.status === "ativo";
  const border = active ? dueTone(group.dueDate, group.accent) : group.status === "concluido" ? "green" : "slate";
  const remaining = remainingTasks(group);

  return (
    <Link to={`/grupos/${group.id}`} className={`card group-card border-${border}`}>
      <div className="group-top">
        <div className="min0">
          <strong className="group-name">{group.name}</strong>
          <p className="muted small">
            {variant === "compact"
              ? `${remaining} tarefa${remaining === 1 ? "" : "s"} restante${remaining === 1 ? "" : "s"} · ${group.members.length} integrantes`
              : group.subject}
          </p>
        </div>
        {group.status !== "arquivado" && <DueBadge iso={group.dueDate} done={group.status === "concluido"} tone={group.accent} />}
      </div>
      {variant !== "compact" && <AvatarStack names={group.members} max={3} />}
      <div className="progress-row">
        <ProgressBar value={progress} tone={group.status === "concluido" ? "green" : group.accent} label={`${group.name}: ${progress}% concluído`} />
        <span>{progress}%</span>
      </div>
    </Link>
  );
}
