import { defineExtension } from "@b2b-crm/extension-sdk";

function RevenueModule() {
  return <section className="panel"><div className="eyebrow">EXTENSION MODULE</div><h2>Revenue intelligence</h2><p>This React module is owned by a trusted extension package.</p></section>;
}

export default defineExtension({
  manifest: {
    apiVersion: 2,
    id: "example.revenue-intelligence",
    name: "Revenue Intelligence",
    version: "1.0.0",
    publisher: "Example Studio",
    description: "Example trusted code module with navigation and a command-palette action.",
    categories: ["analytics", "module"],
    permissions: ["ui:navigation", "ui:commands", "crm:deals:read"]
  },
  contributes: {
    modules: [{ id: "revenue", title: "Revenue intelligence", navigation: { label: "Revenue", section: "relationships" }, component: RevenueModule }],
    commands: [{ id: "open-revenue", title: "Open revenue intelligence", category: "Revenue", keywords: ["forecast", "pipeline"], href: "/extension-modules/example.revenue-intelligence/revenue" }]
  }
});
