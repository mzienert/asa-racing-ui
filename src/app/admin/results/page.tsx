export default function ResultsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Race Results</h1>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">View and manage race results here.</p>
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md">
            Record New Results
          </button>
        </div>
        {/* Results list will go here */}
        <div className="border rounded-lg p-4">
          <p className="text-center text-muted-foreground">Results list coming soon...</p>
        </div>
      </div>
    </div>
  );
}
