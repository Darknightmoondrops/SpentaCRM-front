"use client";

import { defineExtension } from "../sdk";

function AccountHealthWidget() {
  return (
    <section className="panel extension-demo-widget">
      <div className="section-heading"><div><div className="eyebrow">EXTENSION</div><h2>Account health</h2></div><span className="badge badge-green">Sample</span></div>
      <div className="extension-health-grid">
        <div><strong>12</strong><span>Healthy accounts</span></div>
        <div><strong>3</strong><span>Need attention</span></div>
        <div><strong>92%</strong><span>Follow-up coverage</span></div>
      </div>
      <p className="extension-widget-note">Rendered by a dashboard contribution from a code extension.</p>
    </section>
  );
}

function AccountHealthPage() {
  return (
    <>
      <div className="page-header"><div><div className="eyebrow">EXTENSION PAGE</div><h1>Account health</h1><p>This full page is owned by an extension and rendered through the universal extension page host.</p></div></div>
      <div className="stats-grid"><div className="stat-card"><div className="stat-top">Healthy</div><div className="stat-value">12</div><div className="stat-sub">Accounts on track</div></div><div className="stat-card"><div className="stat-top">Attention</div><div className="stat-value">3</div><div className="stat-sub">Follow-up recommended</div></div><div className="stat-card"><div className="stat-top">Coverage</div><div className="stat-value">92%</div><div className="stat-sub">Recent relationship activity</div></div></div>
    </>
  );
}

export const sampleWidgetExtension = defineExtension({
  manifest: {
    apiVersion: 2, id: "b2bcrm.account-health-sample", name: "Account Health Sample", version: "1.0.0", publisher: "B2B CRM Labs",
    description: "Example code extension showing how dashboard widgets are contributed.", categories: ["analytics", "developer"],
    permissions: ["ui:dashboard", "crm:companies:read"], builtIn: true,
  },
  contributes: {
    pages: [{ id: "account-health", title: "Account health", component: AccountHealthPage }],
    sidebar: [{ id: "account-health-nav", label: "Account health", pageId: "account-health", section: "extensions" }],
    dashboardWidgets: [{ id: "account-health", title: "Account health", zone: "dashboard.afterActivity", component: AccountHealthWidget }],
    commands: [{ id: "open-account-health", title: "Open account health", category: "Accounts", keywords: ["health", "customers"], href: "/extension-pages/b2bcrm.account-health-sample/account-health" }],
  },
});
