import Link from "next/link"

export default function Page() {
  return (
    <div className="flex flex-col gap-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold mb-4">Welcome to Admin Dashboard</h1>
        <div className="border rounded-lg p-8 bg-muted/50">
          <div className="flex justify-between items-center">
            <p className="text-muted-foreground">
              Manage your races and racers from here
            </p>
            <Link 
              href="/admin/races" 
              className="bg-primary text-primary-foreground px-6 py-3 rounded-md hover:bg-primary/90"
            >
              Create a Race
            </Link>
          </div>
        </div>
      </div>

      {/* Past Races Section */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Past Races</h2>
        <div className="border rounded-lg p-8 bg-muted/50">
          <p className="text-center text-muted-foreground">
            No past races found. Create your first race to get started!
          </p>
        </div>
      </div>
    </div>
  )
}