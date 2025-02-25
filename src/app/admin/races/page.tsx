'use client';
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/app/store/store";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { persistRace, updatePersistedRace, loadRacesFromStorage } from "@/app/store/features/racesSlice";
import { Checkbox } from "@/components/ui/checkbox";
import { selectHasActiveRace, selectActiveRace } from '@/app/store/selectors/raceSelectors';

export default function RacesPage() {
  const dispatch = useDispatch<AppDispatch>();
  const hasActiveRace = useSelector(selectHasActiveRace);
  const activeRace = useSelector(selectActiveRace);
  const [isCreatingRace, setIsCreatingRace] = useState(false);
  const [date, setDate] = useState<Date>();
  const [raceName, setRaceName] = useState('');
  const [raceFormat, setRaceFormat] = useState('');
  const [raceClasses, setRaceClasses] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    dispatch(loadRacesFromStorage());
  }, [dispatch]);

  useEffect(() => {
    if (isEditing && activeRace) {
      setRaceName(activeRace.name);
      setRaceFormat(activeRace.raceFormat);
      setDate(activeRace.date ? new Date(activeRace.date) : undefined);
    }
  }, [isEditing, activeRace]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;

    const formData = {
      name: raceName,
      date: date.toISOString(),
      raceFormat,
      raceClasses,
      completed: false,
    };

    if (isEditing) {
      dispatch(updatePersistedRace({ ...formData, id: activeRace!.id }));
    } else {
      dispatch(persistRace(formData));
    }
    
    setIsCreatingRace(false);
    setIsEditing(false);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Race Management</h1>
      <div className="space-y-4">
        <Card>
          <div className="flex flex-col">
            <CardHeader>
              <p className="text-muted-foreground">Manage your racing events here.</p>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              {!hasActiveRace && !isCreatingRace && (
                <button 
                  onClick={() => setIsCreatingRace(true)}
                  className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 transition-colors"
                >
                  Start New Race
                </button>
              )}
              {hasActiveRace && !isEditing && (
                <div className="w-full max-w-md">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Current Race</h2>
                    <Button
                      onClick={() => setIsEditing(true)}
                      variant="outline"
                    >
                      Edit Race
                    </Button>
                  </div>
                  {activeRace && (
                    <div className="space-y-3 border rounded-lg p-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Race Name:</span>
                        <span className="font-medium">{activeRace.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date:</span>
                        <span className="font-medium">
                          {activeRace.date ? new Date(activeRace.date).toLocaleDateString() : 'Not set'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Race Format:</span>
                        <span className="font-medium">{activeRace.raceFormat || 'Not set'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Race Classes:</span>
                        <span className="font-medium">
                          {activeRace.raceClasses?.length > 0 
                            ? activeRace.raceClasses.join(', ')
                            : 'None selected'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <span className="font-medium">
                          {activeRace.completed ? 'Completed' : 'In Progress'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {(isCreatingRace || isEditing) && (
                <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
                  <div>
                    <label htmlFor="raceName" className="block text-sm font-medium mb-1">
                      Race Name
                    </label>
                    <input
                      type="text"
                      id="raceName"
                      value={raceName}
                      onChange={(e) => setRaceName(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
                      placeholder="Enter race name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Race Date
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Race Format
                    </label>
                    <Select onValueChange={setRaceFormat} value={raceFormat}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a race format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single-elimination">Single Elimination</SelectItem>
                        <SelectItem value="double-elimination">Double Elimination</SelectItem>
                        <SelectItem value="head-to-head">Head to Head</SelectItem>
                        <SelectItem value="time-trial">Time Trial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-4">
                    <label className="block text-sm font-medium">Race Classes</label>
                    <div className="flex gap-6">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="mens-open" 
                          checked={raceClasses.includes('mens-open')}
                          onCheckedChange={(checked) => {
                            setRaceClasses(prev => 
                              checked 
                                ? [...prev, 'mens-open']
                                : prev.filter(c => c !== 'mens-open')
                            );
                          }}
                        />
                        <label htmlFor="mens-open" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Men's Open
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="mens-amateur"
                          checked={raceClasses.includes('mens-amateur')}
                          onCheckedChange={(checked) => {
                            setRaceClasses(prev => 
                              checked 
                                ? [...prev, 'mens-amateur']
                                : prev.filter(c => c !== 'mens-amateur')
                            );
                          }}
                        />
                        <label htmlFor="mens-amateur" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Men's Amateur
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="womens"
                          checked={raceClasses.includes('womens')}
                          onCheckedChange={(checked) => {
                            setRaceClasses(prev => 
                              checked 
                                ? [...prev, 'womens']
                                : prev.filter(c => c !== 'womens')
                            );
                          }}
                        />
                        <label htmlFor="womens" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Women's
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsCreatingRace(false);
                        setIsEditing(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      {isEditing ? 'Update Race' : 'Create Race'}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </div>
        </Card>
        {/* Race list will go here */}
        <div className="border rounded-lg p-4">
          <p className="text-center text-muted-foreground">Race list coming soon...</p>
        </div>
      </div>
    </div>
  )
} 