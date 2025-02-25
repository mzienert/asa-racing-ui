'use client';
import { persistRacer, updatePersistedRacer, loadRacersFromStorage } from '@/app/store/features/racersSlice';
import { selectRaceClasses, selectRacersByClass } from '@/app/store/selectors/raceSelectors';
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/app/store/store';
import { selectHasActiveRace } from '@/app/store/selectors/raceSelectors';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import type { Racer } from '@/app/store/features/racersSlice';
import type { AppDispatch } from '@/app/store/store';

interface RacerFormProps {
  classId: string;
  editRacer?: Racer | null;
  onCancelEdit?: () => void;
}

const RacerForm = ({ classId, editRacer, onCancelEdit }: RacerFormProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const [name, setName] = useState(editRacer?.name || '');
  const [bibNumber, setBibNumber] = useState(editRacer?.bibNumber || '');

  useEffect(() => {
    if (editRacer) {
      setName(editRacer.name);
      setBibNumber(editRacer.bibNumber);
    }
  }, [editRacer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editRacer) {
      dispatch(updatePersistedRacer({ id: editRacer.id, name, bibNumber, classId }));
      onCancelEdit?.();
    } else {
      dispatch(persistRacer({ name, bibNumber, classId }));
    }
    setName('');
    setBibNumber('');
  };

  const handleCancel = () => {
    setName('');
    setBibNumber('');
    onCancelEdit?.();
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={bibNumber}
          onChange={(e) => setBibNumber(e.target.value)}
          placeholder="Bib"
          maxLength={3}
          className="flex h-10 w-20 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Racer Name"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <button 
          type="submit"
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        >
          {editRacer ? 'Update Racer' : 'Add Racer'}
        </button>
        {editRacer && (
          <button
            type="button"
            onClick={handleCancel}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export const Racers = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [editingRacer, setEditingRacer] = useState<Racer | null>(null);
  const hasRace = useSelector(selectHasActiveRace);
  const raceClasses = useSelector(selectRaceClasses);
  const racersByClass = useSelector((state: RootState) => {
    const result: Record<string, Racer[]> = {};
    raceClasses.forEach(raceClass => {
      result[raceClass] = selectRacersByClass(state, raceClass);
    });
    return result;
  });

  useEffect(() => {
    dispatch(loadRacersFromStorage());
  }, [dispatch]);

  if (!hasRace) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">Racer Management</h1>
        <div className="space-y-4">
          <Card>
            <div className="flex flex-col">
              <CardHeader>
                <p className="text-muted-foreground">Manage your racers here.</p>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <p className="text-muted-foreground">Please create a race first</p>
              </CardContent>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Racer Management</h1>
      <div className="space-y-6">
        {raceClasses.map((raceClass) => (
          <Card key={raceClass}>
            <CardHeader>
              <h2 className="text-2xl font-semibold">{raceClass}</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {racersByClass[raceClass]?.map((racer) => (
                  <div 
                    key={racer.id} 
                    className={`flex items-center justify-between p-2 rounded transition-colors
                      ${editingRacer?.id === racer.id 
                        ? 'bg-primary/5 border border-primary/20' 
                        : 'bg-gray-50'
                      }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-medium">#{racer.bibNumber}</span>
                      <span>{racer.name}</span>
                    </div>
                    <button
                      onClick={() => setEditingRacer(racer)}
                      className={`p-2 rounded-full transition-colors
                        ${editingRacer?.id === racer.id 
                          ? 'bg-primary/10 hover:bg-primary/20' 
                          : 'hover:bg-gray-200'
                        }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={editingRacer?.id === racer.id ? 'text-primary' : ''}
                      >
                        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                      </svg>
                    </button>
                  </div>
                ))}
                
                <RacerForm
                  classId={raceClass}
                  editRacer={editingRacer?.classId === raceClass ? editingRacer : null}
                  onCancelEdit={() => setEditingRacer(null)}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Racers;