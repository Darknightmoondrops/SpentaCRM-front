"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useExtensions } from "@/extensions/extension-provider";
import { CloseIcon, SearchIcon } from "./icons";
import { companies, contacts, deals, projects, tasks } from "@/lib/mock-data";
import { hydrateMockCompanies } from "@/lib/mock-company-store";
import { hydrateMockContacts } from "@/lib/mock-contact-store";
import { hydrateMockDeals } from "@/lib/mock-deal-store";
import { hydrateMockProjects } from "@/lib/mock-project-store";
import { hydrateMockTasks } from "@/lib/mock-task-store";

type SearchResult = { label:string; meta:string; group:string; href?:Route; command?:()=>void|Promise<void> };

export function GlobalSearchCommand({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [searchCompanies, setSearchCompanies] = useState(companies);
  const [searchContacts, setSearchContacts] = useState(contacts);
  const [searchDeals, setSearchDeals] = useState(deals);
  const [searchProjects, setSearchProjects] = useState(projects);
  const [searchTasks, setSearchTasks] = useState(tasks);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { extensions, enabledIds } = useExtensions();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    requestAnimationFrame(() => searchInputRef.current?.focus());
    setSearchCompanies(hydrateMockCompanies(companies));
    setSearchContacts(hydrateMockContacts(contacts));
    setSearchDeals(hydrateMockDeals(deals));
    setSearchProjects(hydrateMockProjects(projects));
    setSearchTasks(hydrateMockTasks(tasks));
  }, []);

  const extensionCommands = useMemo(() => extensions.flatMap(extension => enabledIds.has(extension.manifest.id) ? (extension.contributes?.commands || []).map(command => ({ extension, command })) : []), [extensions, enabledIds]);

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    const showCommands = q.startsWith(">");
    const clean = showCommands ? q.slice(1).trim() : q;
    if (!q) return extensionCommands.slice(0,5).map(({extension,command}) => ({ label:command.title, meta:`${extension.manifest.name} · Command`, group:"Commands", href:command.href as Route|undefined, command: command.run ? () => command.run!({ pathname }) : undefined }));
    if (showCommands) return extensionCommands.filter(({extension,command}) => `${command.title} ${command.category || ""} ${(command.keywords || []).join(" ")} ${extension.manifest.name}`.toLowerCase().includes(clean)).slice(0,10).map(({extension,command}) => ({ label:command.title, meta:`${extension.manifest.name} · ${command.category || "Command"}`, group:"Commands", href:command.href as Route|undefined, command: command.run ? () => command.run!({ pathname }) : undefined }));
    const resultSet: SearchResult[] = [
      ...searchCompanies.filter((item) => `${item.name} ${item.industry} ${item.location}`.toLowerCase().includes(clean)).map((item) => ({ label:item.name, meta:`Company · ${item.industry}`, href:`/companies/${item.id}` as Route, group:"Companies" })),
      ...searchContacts.filter((item) => `${item.name} ${item.role} ${item.company}`.toLowerCase().includes(clean)).map((item) => ({ label:item.name, meta:`Contact · ${item.company}`, href:`/contacts/${item.id}` as Route, group:"Contacts" })),
      ...searchDeals.filter((item) => `${item.title} ${item.company} ${item.owner}`.toLowerCase().includes(clean)).map((item) => ({ label:item.title, meta:`Deal · ${item.company}`, href:`/deals/${item.id}` as Route, group:"Deals" })),
      ...searchProjects.filter((item) => `${item.title} ${item.company} ${item.owner}`.toLowerCase().includes(clean)).map((item) => ({ label:item.title, meta:`Project · ${item.company}`, href:`/projects/${item.id}` as Route, group:"Projects" })),
      ...searchTasks.filter((item) => !item.archivedAt && `${item.title} ${item.relation} ${item.assignee}`.toLowerCase().includes(clean)).map((item) => ({ label:item.title, meta:`Task · ${item.relation}`, href:`/tasks?task=${item.id}` as Route, group:"Tasks" })),
      ...extensionCommands.filter(({extension,command}) => `${command.title} ${command.category || ""} ${(command.keywords || []).join(" ")} ${extension.manifest.name}`.toLowerCase().includes(clean)).map(({extension,command}) => ({ label:command.title, meta:`${extension.manifest.name} · Command`, group:"Commands", href:command.href as Route|undefined, command:command.run ? () => command.run!({ pathname }) : undefined })),
    ];
    return resultSet.slice(0, 12);
  }, [query, searchCompanies, searchContacts, searchDeals, searchProjects, searchTasks, extensionCommands, pathname]);

  async function execute(result: SearchResult) {
    if (result.command) await result.command();
    if (result.href) router.push(result.href);
    onClose();
  }

  return <div className="command-backdrop" role="presentation" onMouseDown={onClose}>
    <section className="command" role="dialog" aria-modal="true" aria-label="Global CRM search and commands" onMouseDown={(event) => event.stopPropagation()}>
      <div className="command-input"><SearchIcon/><input ref={searchInputRef} placeholder="Search CRM or type > for extension commands..." value={query} onChange={(event) => setQuery(event.target.value)}/><button onClick={onClose} aria-label="Close search"><CloseIcon/></button></div>
      <div className="command-body">
        {!query && <div className="command-empty"><strong>Search & command palette</strong><span>Search CRM records. Type <code>&gt;</code> to run commands contributed by extensions.</span></div>}
        {query && results.length === 0 && <div className="command-empty"><strong>No matching records or commands</strong><span>Try a company, contact, owner, project name, or <code>&gt; command</code>.</span></div>}
        {results.map((result,index) => result.command ? <button key={`${result.group}-${index}-${result.label}`} className="command-result command-result-button" onClick={() => void execute(result)}><span><small className="result-group">{result.group}</small>{result.label}</span><small>{result.meta}</small></button> : result.href ? <Link key={`${result.href}-${index}-${result.label}`} href={result.href} className="command-result" onClick={onClose}><span><small className="result-group">{result.group}</small>{result.label}</span><small>{result.meta}</small></Link> : null)}
      </div>
      <div className="command-footer"><span>ESC close</span><span>⌘K open</span><span>&gt; commands</span><span>{results.length} results</span></div>
    </section>
  </div>;
}
