'use client';
import React from 'react';
import { useSelector } from 'react-redux';
import { selectRaceClasses } from '@/app/store/selectors/raceSelectors';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { RootState } from '@/app/store/store';

export default function Brackets() {
  // Use memoized selectors with proper typing
  const raceClasses = useSelector((state: RootState) => selectRaceClasses(state));
/*   const racersByClass = useSelector((state: RootState) => selectRacersByAllClasses(state)); */

  // Check if there's an active race or any races at all
  const hasRaces = useSelector((state: RootState) => (state.races?.items || []).length > 0);

  // Handler for generating brackets
  const handleGenerateBrackets = () => {
    // Implement bracket generation logic here
    console.log('Generating brackets');
  };

  // If no races exist, show the create race message
  if (!hasRaces) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h2 className="text-xl font-semibold mb-4">No Races Available</h2>
        <p className="text-gray-600 mb-6">Please create a race first to manage brackets.</p>
        <Link href="/admin/races/create">
          <Button>Create Race</Button>
        </Link>
      </div>
    );
  }

  // Rest of your component that displays brackets
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Brackets</h1>

      {/* Display brackets by class */}
      {raceClasses && raceClasses.length > 0 ? (
        <div>
          {/* Your bracket display logic here */}
{/*           {raceClasses.map((className: string) => (
            <div key={className} className="mb-8">
              <h2 className="text-xl font-semibold mb-4">{className} Bracket</h2> */}
              {/* Bracket visualization component */}
{/*               {racersByClass && racersByClass[className] && (
                <BracketView racers={racersByClass[className]} />
              )}
            </div>
          ))} */}
        </div>
      ) : (
        <p className="text-gray-500">No race classes defined yet.</p>
      )}

      {/* Generate Brackets button */}
      <div className="mt-8">
        <Button onClick={handleGenerateBrackets}>Generate Brackets</Button>
      </div>
    </div>
  );
}
