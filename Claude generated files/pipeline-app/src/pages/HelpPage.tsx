export default function HelpPage() {
  return (
    <div className="h-full">
      <h1 className="text-xl font-semibold text-gray-900 mb-4">Help</h1>
      <iframe
        src="/help/innovation-pipeline.html"
        className="w-full rounded-lg border border-gray-200"
        style={{ height: 'calc(100vh - 160px)' }}
        title="Innovation Pipeline Guide"
      />
    </div>
  );
}
