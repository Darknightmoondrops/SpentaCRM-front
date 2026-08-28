export default function ProjectsLoading() {
  return <div className="projects-loading" aria-label="Loading projects" role="status"><div className="page-title-skeleton" /><div className="project-metrics-loading"><div /><div /><div /><div /></div><div className="project-toolbar-loading" /><div className="project-grid-loading">{Array.from({ length: 6 }, (_, index) => <div key={index}><span /><span /><span /></div>)}</div><span className="sr-only">Loading projects...</span></div>;
}
