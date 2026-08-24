export function getLastResearchNote(notes?: Record<string, string>): string | undefined {
  const entries = Object.entries(notes ?? {});
  return entries.length ? entries[entries.length - 1][1] : undefined;
}

export function DownloadResearchNoteButton({ notes }: { notes?: Record<string, string> }) {
  const content = getLastResearchNote(notes);
  if (!content) return null;

  const download = () => {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "研究报告.md";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  return <div className="report-download">
    <button type="button" className="download-report-button" onClick={download}>
      下载完整研究笔记
    </button>
  </div>;
}
