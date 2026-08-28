import { defineExtension } from "@spentacrm/extension-sdk";

function AccountHealthWidget() {
  return <section className="panel"><h2>Account Health</h2><p>Your extension owns this UI.</p></section>;
}

export default defineExtension({
  manifest: {
    apiVersion: 3,
    id: "example.account-health",
    name: "Account Health",
    version: "1.0.0",
    publisher: "Example Studio",
    description: "Adds an account-health widget to the dashboard.",
    categories: ["analytics"],
    permissions: ["ui:dashboard", "crm:companies:read"]
  },
  contributes: {
    dashboardWidgets: [{ id: "health", title: "Account health", zone: "dashboard.afterActivity", component: AccountHealthWidget }]
  }
});
