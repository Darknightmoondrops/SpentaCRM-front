"use client";

import type { Route } from "next";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { TaskIcon } from "@/components/icons";
import { Badge, SectionTitle } from "@/components/ui";
import { hydrateMockTasks } from "@/lib/mock-task-store";
import { dashboardFiltersFromSearchParams, dashboardQuery, filterDashboardTasks } from "@/lib/dashboard-utils";
import { taskDueBucket, taskDueDate, taskPriorityTone } from "@/lib/task-utils";
import type { Contact, Deal, Project, Task } from "@/lib/types";

const bucketRank = { OVERDUE: 0, TODAY: 1, UPCOMING: 2, DONE: 3 } as const;
const priorityRank = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 } as const;

export function DashboardPriorityTasks({ seedTasks, contacts, deals, projects }: { seedTasks: Task[]; contacts: Contact[]; deals: Deal[]; projects: Project[] }) {
  const searchParams = useSearchParams();
  const filters = useMemo(() => dashboardFiltersFromSearchParams(searchParams), [searchParams]);
  const [tasks, setTasks] = useState(seedTasks);
  useEffect(() => setTasks(hydrateMockTasks(seedTasks)), [seedTasks]);
  const refs = useMemo(() => ({ contacts, deals, projects }), [contacts, deals, projects]);
  const visible = useMemo(() => filterDashboardTasks(tasks, filters, refs)
    .filter((task) => task.status !== "DONE")
    .sort((a, b) => bucketRank[taskDueBucket(a)] - bucketRank[taskDueBucket(b)] || priorityRank[a.priority] - priorityRank[b.priority] || (taskDueDate(a)?.getTime() ?? Infinity) - (taskDueDate(b)?.getTime() ?? Infinity))
    .slice(0, 6), [tasks, filters, refs]);
  const query = dashboardQuery(filters, "tasks", { view: "OPEN" });

  return (
    <section className="panel dashboard-work-panel">
      <SectionTitle eyebrow="Work queue" title="Due next" action={{ label: "All tasks", href: `/tasks${query ? `?${query}` : ""}` as Route }} />
      <div className="compact-list dashboard-due-list">
        {visible.map((task) => {
          const bucket = taskDueBucket(task);
          const hrefQuery = dashboardQuery(filters, "tasks", { view: "OPEN", task: task.id });
          return <Link href={`/tasks?${hrefQuery}` as Route} className="compact-item dashboard-due-item" key={task.id}>
            <div className="compact-icon"><TaskIcon /></div>
            <div className="compact-copy"><strong>{task.title}</strong><span>{task.relation} · {task.assignee}</span></div>
            <div className="compact-meta"><Badge tone={bucket === "OVERDUE" ? "red" : bucket === "TODAY" ? "yellow" : taskPriorityTone(task.priority)}>{bucket}</Badge><small>{task.due}</small></div>
          </Link>;
        })}
        {!visible.length && <div className="dashboard-empty-inline">No open work is due in this scope.</div>}
      </div>
    </section>
  );
}
