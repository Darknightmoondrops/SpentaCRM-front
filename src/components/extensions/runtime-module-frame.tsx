"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { buildRuntimeDocument, type RuntimeSurfaceContext } from "@/extensions/module-runtime";

export function RuntimeModuleFrame({
  extensionId,
  surfaceId,
  entry,
  surfaceType,
  entityType,
  entityId,
  height = "content",
}: {
  extensionId: string;
  surfaceId: string;
  entry: string;
  surfaceType: RuntimeSurfaceContext["surfaceType"];
  entityType?: string;
  entityId?: string;
  height?: "compact" | "content" | "viewport" | number;
}) {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [srcDoc, setSrcDoc] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [reportedHeight, setReportedHeight] = useState<number | null>(typeof height === "number" ? height : null);

  useEffect(() => {
    let active = true;
    setError(null);
    setSrcDoc("");
    buildRuntimeDocument(extensionId, entry, { extensionId, surfaceId, surfaceType, entityType, entityId })
      .then(doc => { if (active) setSrcDoc(doc); })
      .catch(err => { if (active) setError(err instanceof Error ? err.message : "The module surface could not be loaded."); });
    return () => { active = false; };
  }, [extensionId, entry, surfaceId, surfaceType, entityType, entityId]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.source !== iframeRef.current?.contentWindow || !event.data || event.data.source !== "spentacrm-module" || event.data.extensionId !== extensionId) return;
      if (event.data.type === "resize") {
        const next = Number(event.data.payload?.height);
        if (Number.isFinite(next)) setReportedHeight(Math.max(120, Math.min(next, 2400)));
      }
      if (event.data.type === "navigate") {
        const href = String(event.data.payload?.href || "");
        if (href.startsWith("/") && !href.startsWith("//")) router.push(href);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [extensionId, router]);

  if (error) return <div className="runtime-module-error"><strong>Module surface unavailable</strong><p>{error}</p></div>;
  if (!srcDoc) return <div className="runtime-module-loading" aria-busy="true"><span/><span/><span/></div>;

  const styleHeight = reportedHeight ?? (height === "viewport" ? 720 : height === "compact" ? 220 : 520);
  return <iframe
    ref={iframeRef}
    className="runtime-module-frame"
    title={`${extensionId}:${surfaceId}`}
    srcDoc={srcDoc}
    sandbox="allow-scripts allow-forms allow-popups allow-downloads"
    referrerPolicy="no-referrer"
    style={{ height: `${styleHeight}px` }}
  />;
}
