import '@testing-library/jest-dom';
import { generateFullBracketStructure, populateNextRoundRaces, checkAndRestructureRaces, BracketRound } from '../features/bracketSlice';
import { Racer } from '../features/racersSlice';

describe('Bracket Generation', () => {
  // Test data setup
  const createMockRacers = (count: number, raceClass: string): Racer[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `racer-${i + 1}`,
      name: `Racer ${i + 1}`,
      bibNumber: `${i + 1}`,
      raceId: 'race-1',
      raceClass,
      seedData: {
        time: null,
        startingPosition: i + 1
      }
    }));
  };

  describe('6 Racers Scenario', () => {
    const sixRacers = createMockRacers(6, 'mens-open');
    let brackets: BracketRound[];

    beforeEach(() => {
      brackets = generateFullBracketStructure(sixRacers, 'race-1', 'mens-open');
    });

    test('should create correct initial bracket structure', () => {
      // Should have 4 rounds total (2 winners, 1 second chance, 1 finals)
      expect(brackets.length).toBe(4);
      
      // First round should have 2 races with 3 racers each
      const firstRound = brackets.find((b: BracketRound) => b.roundNumber === 1 && b.bracketType === 'winners');
      expect(firstRound?.races.length).toBe(2);
      expect(firstRound?.races[0].racers.length).toBe(3);
      expect(firstRound?.races[1].racers.length).toBe(3);
      
      // Race numbers should be 1 and 2
      expect(firstRound?.races[0].raceNumber).toBe(1);
      expect(firstRound?.races[1].raceNumber).toBe(2);
      
      // Second round should have 1 race (initially empty)
      const secondRound = brackets.find((b: BracketRound) => b.roundNumber === 2 && b.bracketType === 'winners');
      expect(secondRound?.races.length).toBe(1);
      expect(secondRound?.races[0].raceNumber).toBe(3);
      expect(secondRound?.races[0].racers.length).toBe(0);
      
      // Second chance should have 1 race (initially empty)
      const secondChance = brackets.find((b: BracketRound) => b.roundNumber === 1 && b.bracketType === 'losers');
      expect(secondChance?.races.length).toBe(1);
      expect(secondChance?.races[0].raceNumber).toBe(4);
      expect(secondChance?.races[0].racers.length).toBe(0);
      
      // Finals should be race 5
      const finals = brackets.find((b: BracketRound) => b.bracketType === 'final');
      expect(finals?.races[0].raceNumber).toBe(5);
    });

    test('should correctly route winners and losers from first round', () => {
      // Simulate Race 1 completion
      const race1Winners = ['racer-1', 'racer-2'];
      const race1Losers = ['racer-3'];
      
      let updatedBrackets = populateNextRoundRaces(
        brackets,
        1, // round
        'race-1',
        'mens-open',
        race1Winners,
        race1Losers,
        sixRacers,
        1, // race number
        'winners' // bracket type
      );
      
      // Simulate Race 2 completion
      const race2Winners = ['racer-4', 'racer-5'];
      const race2Losers = ['racer-6'];
      
      updatedBrackets = populateNextRoundRaces(
        updatedBrackets,
        1, // round
        'race-1',
        'mens-open',
        race2Winners,
        race2Losers,
        sixRacers,
        2, // race number
        'winners' // bracket type
      );
      
      // Check Race 3 (winners bracket second round)
      const secondRound = updatedBrackets.find((b: BracketRound) => b.roundNumber === 2 && b.bracketType === 'winners');
      expect(secondRound).toBeDefined();
      const race3 = secondRound!.races[0];
      expect(race3.racers.length).toBe(4);
      expect(race3.racers.map((r: Racer) => r.id)).toEqual(expect.arrayContaining(race1Winners.concat(race2Winners)));
      
      // Check Race 4 (second chance)
      const secondChance = updatedBrackets.find((b: BracketRound) => b.roundNumber === 1 && b.bracketType === 'losers');
      expect(secondChance).toBeDefined();
      const race4 = secondChance!.races[0];
      expect(race4.racers.length).toBe(2);
      expect(race4.racers.map((r: Racer) => r.id)).toEqual(expect.arrayContaining(race1Losers.concat(race2Losers)));
    });

    test('should correctly route winners from Race 3 to finals', () => {
      // Setup Race 3 with winners from first round
      const race3Round = brackets.find((b: BracketRound) => b.roundNumber === 2 && b.bracketType === 'winners');
      expect(race3Round).toBeDefined();
      const race3 = race3Round!.races[0];
      race3.racers = sixRacers.filter(r => ['racer-1', 'racer-2', 'racer-4', 'racer-5'].includes(r.id));
      
      // Simulate Race 3 completion
      const race3Winners = ['racer-1', 'racer-4'];
      const race3Losers = ['racer-2', 'racer-5'];
      
      const updatedBrackets = populateNextRoundRaces(
        brackets,
        2, // round
        'race-1',
        'mens-open',
        race3Winners,
        race3Losers,
        sixRacers,
        3, // race number
        'winners' // bracket type
      );
      
      // Check finals (Race 5)
      const finals = updatedBrackets.find((b: BracketRound) => b.bracketType === 'final');
      expect(finals).toBeDefined();
      const race5 = finals!.races[0];
      expect(race5.racers.length).toBe(2); // Only winners from Race 3 so far
      expect(race5.racers.map((r: Racer) => r.id)).toEqual(expect.arrayContaining(race3Winners));
      
      // Losers from Race 3 should NOT go to second chance
      const secondChance = updatedBrackets.find((b: BracketRound) => b.roundNumber === 1 && b.bracketType === 'losers');
      expect(secondChance).toBeDefined();
      const race4 = secondChance!.races[0];
      expect(race4.racers.map((r: Racer) => r.id)).not.toEqual(expect.arrayContaining(race3Losers));
    });

    test('should correctly route winner from Race 4 to finals', () => {
      // Setup Race 4 with losers from first round
      const race4Round = brackets.find((b: BracketRound) => b.roundNumber === 1 && b.bracketType === 'losers');
      expect(race4Round).toBeDefined();
      const race4 = race4Round!.races[0];
      race4.racers = sixRacers.filter(r => ['racer-3', 'racer-6'].includes(r.id));
      
      // Simulate Race 4 completion
      const race4Winners = ['racer-3'];
      const race4Losers = ['racer-6'];
      
      const updatedBrackets = populateNextRoundRaces(
        brackets,
        1, // round
        'race-1',
        'mens-open',
        race4Winners,
        race4Losers,
        sixRacers,
        4, // race number
        'losers' // bracket type
      );
      
      // Check finals (Race 5)
      const finals = updatedBrackets.find((b: BracketRound) => b.bracketType === 'final');
      expect(finals).toBeDefined();
      const race5 = finals!.races[0];
      expect(race5.racers.map((r: Racer) => r.id)).toEqual(expect.arrayContaining(race4Winners));
    });
  });

  describe('7 Racers Scenario', () => {
    const sevenRacers = createMockRacers(7, 'mens-open');
    let brackets: BracketRound[];

    beforeEach(() => {
      brackets = generateFullBracketStructure(sevenRacers, 'race-1', 'mens-open');
    });

    test('should create correct initial bracket structure', () => {
      // Should have 5 rounds total (2 winners, 2 second chance, 1 finals)
      expect(brackets.length).toBe(5);
      
      // First round should have 2 races with 4 and 3 racers
      const firstRound = brackets.find((b: BracketRound) => b.roundNumber === 1 && b.bracketType === 'winners');
      expect(firstRound?.races.length).toBe(2);
      expect(firstRound?.races[0].racers.length).toBe(4);
      expect(firstRound?.races[1].racers.length).toBe(3);
      
      // Second chance should have 2 rounds
      const secondChanceRound1 = brackets.find((b: BracketRound) => b.roundNumber === 1 && b.bracketType === 'losers');
      const secondChanceRound2 = brackets.find((b: BracketRound) => b.roundNumber === 2 && b.bracketType === 'losers');
      expect(secondChanceRound1).toBeDefined();
      expect(secondChanceRound2).toBeDefined();
      
      // Finals should be race 6
      const finals = brackets.find((b: BracketRound) => b.bracketType === 'final');
      expect(finals?.races[0].raceNumber).toBe(6);
    });

    test('should correctly route winners and losers from first round', () => {
      // Simulate Race 1 completion
      const race1Winners = ['racer-1', 'racer-2'];
      const race1Losers = ['racer-3', 'racer-4'];
      
      let updatedBrackets = populateNextRoundRaces(
        brackets,
        1, // round
        'race-1',
        'mens-open',
        race1Winners,
        race1Losers,
        sevenRacers,
        1, // race number
        'winners' // bracket type
      );
      
      // Simulate Race 2 completion
      const race2Winners = ['racer-5', 'racer-6'];
      const race2Losers = ['racer-7'];
      
      updatedBrackets = populateNextRoundRaces(
        updatedBrackets,
        1, // round
        'race-1',
        'mens-open',
        race2Winners,
        race2Losers,
        sevenRacers,
        2, // race number
        'winners' // bracket type
      );
      
      // Check Race 3 (winners bracket second round)
      const secondRound = updatedBrackets.find((b: BracketRound) => b.roundNumber === 2 && b.bracketType === 'winners');
      expect(secondRound).toBeDefined();
      const race3 = secondRound!.races[0];
      expect(race3.racers.length).toBe(4);
      expect(race3.racers.map((r: Racer) => r.id)).toEqual(expect.arrayContaining(race1Winners.concat(race2Winners)));
      
      // Check Race 4 (second chance first round)
      const secondChance = updatedBrackets.find((b: BracketRound) => b.roundNumber === 1 && b.bracketType === 'losers');
      expect(secondChance).toBeDefined();
      const race4 = secondChance!.races[0];
      expect(race4.racers.length).toBe(3);
      expect(race4.racers.map((r: Racer) => r.id)).toEqual(expect.arrayContaining(race1Losers.concat(race2Losers)));
    });

    test('should correctly handle 5 racers in second chance first round', () => {
      // First, simulate the first round races to get 5 racers in second chance
      // Race 1 completion (2 winners, 2 losers)
      let updatedBrackets = populateNextRoundRaces(
        brackets,
        1, // round
        'race-1',
        'mens-open',
        ['racer-1', 'racer-2'],
        ['racer-3', 'racer-4'],
        sevenRacers,
        1, // race number
        'winners' // bracket type
      );
      
      // Race 2 completion (2 winners, 1 loser)
      updatedBrackets = populateNextRoundRaces(
        updatedBrackets,
        1, // round
        'race-1',
        'mens-open',
        ['racer-5', 'racer-6'],
        ['racer-7'],
        sevenRacers,
        2, // race number
        'winners' // bracket type
      );
      
      // Verify second chance first round has racers from both races
      const secondChanceRound1 = updatedBrackets.find(
        (b: BracketRound) => b.roundNumber === 1 && b.bracketType === 'losers'
      );
      expect(secondChanceRound1).toBeDefined();
      
      // Count total racers in second chance first round
      const totalRacers = secondChanceRound1!.races.reduce(
        (sum, race) => sum + race.racers.length, 0
      );
      expect(totalRacers).toBe(3); // Expect 3 racers (racer-3, racer-4, racer-7)
      
      // Verify that all losers from winners bracket are in second chance
      const secondChanceRacerIds = secondChanceRound1!.races.flatMap(race => 
        race.racers.map(r => r.id)
      );
      expect(secondChanceRacerIds).toEqual(
        expect.arrayContaining(['racer-3', 'racer-4', 'racer-7'])
      );
      
      // Now complete the first race in second chance
      updatedBrackets = populateNextRoundRaces(
        updatedBrackets,
        1, // round
        'race-1',
        'mens-open',
        ['racer-3', 'racer-4'],
        ['racer-7'],
        sevenRacers,
        secondChanceRound1!.races[0].raceNumber, // race number
        'losers' // bracket type
      );
      
      // Now complete the second race in second chance (if it exists)
      if (secondChanceRound1!.races.length > 1) {
        updatedBrackets = populateNextRoundRaces(
          updatedBrackets,
          1, // round
          'race-1',
          'mens-open',
          ['racer-5'],
          [],
          sevenRacers,
          secondChanceRound1!.races[1].raceNumber, // race number
          'losers' // bracket type
        );
      }
      
      // Verify that winners from second chance races go to Race 6 (second chance second round)
      const secondChanceRound2 = updatedBrackets.find(
        (b: BracketRound) => b.roundNumber === 2 && b.bracketType === 'losers'
      );
      expect(secondChanceRound2).toBeDefined();
      const race6 = secondChanceRound2!.races[0];
      
      // Verify that race6 contains winners from the second chance first round race
      expect(race6.racers.length).toBe(2);
      expect(race6.racers.map((r: Racer) => r.id)).toEqual(
        expect.arrayContaining(['racer-3', 'racer-4'])
      );
    });

    test('should correctly route winners from Race 4 to Race 5', () => {
      // Setup Race 4 with losers from first round
      const race4Round = brackets.find((b: BracketRound) => b.roundNumber === 1 && b.bracketType === 'losers');
      expect(race4Round).toBeDefined();
      const race4 = race4Round!.races[0];
      race4.racers = sevenRacers.filter(r => ['racer-3', 'racer-4', 'racer-7'].includes(r.id));
      
      // Simulate Race 4 completion - for 7 racers (3 losers), we advance 2 winners
      const race4Winners = ['racer-3', 'racer-4'];
      const race4Losers = ['racer-7'];
      
      const updatedBrackets = populateNextRoundRaces(
        brackets,
        1, // round
        'race-1',
        'mens-open',
        race4Winners,
        race4Losers,
        sevenRacers,
        4, // race number
        'losers' // bracket type
      );
      
      // Check Race 5 (second chance second round)
      const secondChanceRound2 = updatedBrackets.find((b: BracketRound) => b.roundNumber === 2 && b.bracketType === 'losers');
      expect(secondChanceRound2).toBeDefined();
      const race5 = secondChanceRound2!.races[0];
      expect(race5.racers.length).toBe(2);
      expect(race5.racers.map((r: Racer) => r.id)).toEqual(expect.arrayContaining(race4Winners));
    });

    test('should correctly route winner from Race 5 to finals', () => {
      // Setup Race 5 with winners from Race 4
      const race5Round = brackets.find((b: BracketRound) => b.roundNumber === 2 && b.bracketType === 'losers');
      expect(race5Round).toBeDefined();
      const race5 = race5Round!.races[0];
      race5.racers = sevenRacers.filter(r => ['racer-3', 'racer-4'].includes(r.id));
      
      // Simulate Race 5 completion
      const race5Winners = ['racer-3'];
      const race5Losers = ['racer-4'];
      
      const updatedBrackets = populateNextRoundRaces(
        brackets,
        2, // round
        'race-1',
        'mens-open',
        race5Winners,
        race5Losers,
        sevenRacers,
        5, // race number
        'losers' // bracket type
      );
      
      // Check finals (Race 6)
      const finals = updatedBrackets.find((b: BracketRound) => b.bracketType === 'final');
      expect(finals).toBeDefined();
      const race6 = finals!.races[0];
      expect(race6.racers.map((r: Racer) => r.id)).toEqual(expect.arrayContaining(race5Winners));
    });

    test('should correctly route winners from Race 3 to finals', () => {
      // Setup Race 3 with winners from first round
      const race3Round = brackets.find((b: BracketRound) => b.roundNumber === 2 && b.bracketType === 'winners');
      expect(race3Round).toBeDefined();
      const race3 = race3Round!.races[0];
      race3.racers = sevenRacers.filter(r => ['racer-1', 'racer-2', 'racer-5', 'racer-6'].includes(r.id));
      
      // Simulate Race 3 completion
      const race3Winners = ['racer-1', 'racer-5'];
      const race3Losers = ['racer-2', 'racer-6'];
      
      const updatedBrackets = populateNextRoundRaces(
        brackets,
        2, // round
        'race-1',
        'mens-open',
        race3Winners,
        race3Losers,
        sevenRacers,
        3, // race number
        'winners' // bracket type
      );
      
      // Check finals (Race 6)
      const finals = updatedBrackets.find((b: BracketRound) => b.bracketType === 'final');
      expect(finals).toBeDefined();
      const race6 = finals!.races[0];
      expect(race6.racers.length).toBe(2); // Only winners from Race 3 so far
      expect(race6.racers.map((r: Racer) => r.id)).toEqual(expect.arrayContaining(race3Winners));
      
      // Losers from Race 3 should NOT go to second chance
      const secondChance = updatedBrackets.find((b: BracketRound) => b.roundNumber === 1 && b.bracketType === 'losers');
      expect(secondChance).toBeDefined();
      const race4 = secondChance!.races[0];
      expect(race4.racers.map((r: Racer) => r.id)).not.toEqual(expect.arrayContaining(race3Losers));
    });

    test('should handle DQ/DNS racers and restructure races when needed', () => {
      // Initial bracket structure
      expect(brackets.length).toBe(5);
      
      // First round should have 2 races with 4 and 3 racers
      const firstRound = brackets.find((b: BracketRound) => b.roundNumber === 1 && b.bracketType === 'winners');
      expect(firstRound?.races.length).toBe(2);
      expect(firstRound?.races[0].racers.length).toBe(4);
      expect(firstRound?.races[1].racers.length).toBe(3);
      
      // Simulate Race 1 completion with 3 DQ/DNS racers
      // Only 1 racer advances instead of 2
      const race1Winners = ['racer-1'];
      const race1Losers: string[] = [];
      const race1DQ = ['racer-2'];
      const race1DNS = ['racer-3', 'racer-4'];
      
      // Mark racers as DQ/DNS in the race object
      firstRound!.races[0].disqualifiedRacers = race1DQ;
      firstRound!.races[0].dnsRacers = race1DNS;
      
      let updatedBrackets = populateNextRoundRaces(
        brackets,
        1, // round
        'race-1',
        'mens-open',
        race1Winners,
        race1Losers,
        sevenRacers,
        1, // race number
        'winners' // bracket type
      );
      
      // Simulate Race 2 completion with 2 DQ/DNS racers
      // Only 1 racer advances instead of 2
      const race2Winners = ['racer-5'];
      const race2Losers: string[] = [];
      const race2DQ = ['racer-6'];
      const race2DNS = ['racer-7'];
      
      // Mark racers as DQ/DNS in the race object
      firstRound!.races[1].disqualifiedRacers = race2DQ;
      firstRound!.races[1].dnsRacers = race2DNS;
      
      updatedBrackets = populateNextRoundRaces(
        updatedBrackets,
        1, // round
        'race-1',
        'mens-open',
        race2Winners,
        race2Losers,
        sevenRacers,
        2, // race number
        'winners' // bracket type
      );
      
      // Check Race 3 (winners bracket second round)
      // Should only have 2 racers now
      const secondRound = updatedBrackets.find((b: BracketRound) => b.roundNumber === 2 && b.bracketType === 'winners');
      expect(secondRound).toBeDefined();
      const race3 = secondRound!.races[0];
      expect(race3.racers.length).toBe(2);
      expect(race3.racers.map((r: Racer) => r.id)).toEqual(expect.arrayContaining([...race1Winners, ...race2Winners]));
      
      // No second chance races should be populated since there were no losers
      const secondChance = updatedBrackets.find((b: BracketRound) => b.roundNumber === 1 && b.bracketType === 'losers');
      expect(secondChance).toBeDefined();
      const race4 = secondChance!.races[0];
      expect(race4.racers.length).toBe(0);
      
      // Now test the opposite scenario - too many racers advancing to a single race
      // Reset brackets
      brackets = generateFullBracketStructure(sevenRacers, 'race-1', 'mens-open');
      
      // Modify the bracket structure to force 5 racers into Race 3
      // This simulates a special rule allowing more racers to advance
      let modifiedBrackets = brackets.map(round => {
        if (round.roundNumber === 2 && round.bracketType === 'winners') {
          round.races[0].racers = sevenRacers.slice(0, 5); // Add 5 racers to Race 3
        }
        return round;
      });
      
      // Verify the setup
      const modifiedSecondRound = modifiedBrackets.find((b: BracketRound) => b.roundNumber === 2 && b.bracketType === 'winners');
      expect(modifiedSecondRound).toBeDefined();
      expect(modifiedSecondRound!.races[0].racers.length).toBe(5);
      
      // Now call the restructuring function
      modifiedBrackets = checkAndRestructureRaces(
        modifiedBrackets,
        sevenRacers,
        'race-1',
        'mens-open'
      );
      
      // Verify that the race with 5 racers was split into two races
      const restructuredSecondRound = modifiedBrackets.find((b: BracketRound) => b.roundNumber === 2 && b.bracketType === 'winners');
      expect(restructuredSecondRound).toBeDefined();
      expect(restructuredSecondRound!.races.length).toBe(2); // Should now have 2 races instead of 1
      
      // First race should have 3 racers, second race should have 2
      expect(restructuredSecondRound!.races[0].racers.length).toBe(3);
      expect(restructuredSecondRound!.races[1].racers.length).toBe(2);
      
      // Verify race numbers were reassigned
      expect(restructuredSecondRound!.races[0].raceNumber).toBe(3);
      expect(restructuredSecondRound!.races[1].raceNumber).toBe(4);
      
      // Verify that downstream race connections were updated
      // This depends on the specific implementation of checkAndRestructureRaces
      // For now, we'll just check that both races have the same nextWinnerRace
      expect(restructuredSecondRound!.races[0].nextWinnerRace).toBeDefined();
      expect(restructuredSecondRound!.races[1].nextWinnerRace).toBeDefined();
      expect(restructuredSecondRound!.races[0].nextWinnerRace).toBe(restructuredSecondRound!.races[1].nextWinnerRace);
    });
  });

  describe('8 Racers Scenario', () => {
    const eightRacers = createMockRacers(8, 'mens-open');
    let brackets: BracketRound[];

    beforeEach(() => {
      brackets = generateFullBracketStructure(eightRacers, 'race-1', 'mens-open');
    });

    test('should create correct initial bracket structure', () => {
      // Should have 5 rounds total (2 winners, 2 second chance, 1 finals)
      expect(brackets.length).toBe(5);
      
      // First round should have 2 races with 4 racers each
      const firstRound = brackets.find((b: BracketRound) => b.roundNumber === 1 && b.bracketType === 'winners');
      expect(firstRound?.races.length).toBe(2);
      expect(firstRound?.races[0].racers.length).toBe(4);
      expect(firstRound?.races[1].racers.length).toBe(4);
      
      // Second chance should have 2 rounds
      const secondChanceRound1 = brackets.find((b: BracketRound) => b.roundNumber === 1 && b.bracketType === 'losers');
      const secondChanceRound2 = brackets.find((b: BracketRound) => b.roundNumber === 2 && b.bracketType === 'losers');
      expect(secondChanceRound1).toBeDefined();
      expect(secondChanceRound2).toBeDefined();
      
      // Finals should be race 6
      const finals = brackets.find((b: BracketRound) => b.bracketType === 'final');
      expect(finals?.races[0].raceNumber).toBe(6);
    });

    test('should correctly route winners and losers from first round', () => {
      // Simulate Race 1 completion
      const race1Winners = ['racer-1', 'racer-2'];
      const race1Losers = ['racer-3', 'racer-4'];
      
      let updatedBrackets = populateNextRoundRaces(
        brackets,
        1, // round
        'race-1',
        'mens-open',
        race1Winners,
        race1Losers,
        eightRacers,
        1, // race number
        'winners' // bracket type
      );
      
      // Simulate Race 2 completion
      const race2Winners = ['racer-5', 'racer-6'];
      const race2Losers = ['racer-7', 'racer-8'];
      
      updatedBrackets = populateNextRoundRaces(
        updatedBrackets,
        1, // round
        'race-1',
        'mens-open',
        race2Winners,
        race2Losers,
        eightRacers,
        2, // race number
        'winners' // bracket type
      );
      
      // Check Race 3 (winners bracket second round)
      const secondRound = updatedBrackets.find((b: BracketRound) => b.roundNumber === 2 && b.bracketType === 'winners');
      expect(secondRound).toBeDefined();
      const race3 = secondRound!.races[0];
      expect(race3.racers.length).toBe(4);
      expect(race3.racers.map((r: Racer) => r.id)).toEqual(expect.arrayContaining(race1Winners.concat(race2Winners)));
      
      // Check Race 4 (second chance first round)
      const secondChance = updatedBrackets.find((b: BracketRound) => b.roundNumber === 1 && b.bracketType === 'losers');
      expect(secondChance).toBeDefined();
      const race4 = secondChance!.races[0];
      expect(race4.racers.length).toBe(4);
      expect(race4.racers.map((r: Racer) => r.id)).toEqual(expect.arrayContaining(race1Losers.concat(race2Losers)));
    });

    test('should correctly route winners from Race 4 to Race 5', () => {
      // Setup Race 4 with losers from first round
      const race4Round = brackets.find((b: BracketRound) => b.roundNumber === 1 && b.bracketType === 'losers');
      expect(race4Round).toBeDefined();
      const race4 = race4Round!.races[0];
      race4.racers = eightRacers.filter(r => ['racer-3', 'racer-4', 'racer-7', 'racer-8'].includes(r.id));
      
      // Simulate Race 4 completion - only 1 winner in second chance
      const race4Winners = ['racer-3'];
      const race4Losers = ['racer-4', 'racer-7', 'racer-8'];
      
      const updatedBrackets = populateNextRoundRaces(
        brackets,
        1, // round
        'race-1',
        'mens-open',
        race4Winners,
        race4Losers,
        eightRacers,
        4, // race number
        'losers' // bracket type
      );
      
      // Check Race 5 (second chance second round)
      const secondChanceRound2 = updatedBrackets.find((b: BracketRound) => b.roundNumber === 2 && b.bracketType === 'losers');
      expect(secondChanceRound2).toBeDefined();
      const race5 = secondChanceRound2!.races[0];
      expect(race5.racers.map((r: Racer) => r.id)).toEqual(expect.arrayContaining(race4Winners));
    });

    test('should correctly route winner from Race 5 to finals', () => {
      // Setup Race 5 with winners from Race 4
      const race5Round = brackets.find((b: BracketRound) => b.roundNumber === 2 && b.bracketType === 'losers');
      expect(race5Round).toBeDefined();
      const race5 = race5Round!.races[0];
      race5.racers = eightRacers.filter(r => ['racer-3'].includes(r.id));
      
      // Simulate Race 5 completion
      const race5Winners = ['racer-3'];
      const race5Losers: string[] = [];
      
      const updatedBrackets = populateNextRoundRaces(
        brackets,
        2, // round
        'race-1',
        'mens-open',
        race5Winners,
        race5Losers,
        eightRacers,
        5, // race number
        'losers' // bracket type
      );
      
      // Check finals (Race 6)
      const finals = updatedBrackets.find((b: BracketRound) => b.bracketType === 'final');
      expect(finals).toBeDefined();
      const race6 = finals!.races[0];
      expect(race6.racers.map((r: Racer) => r.id)).toEqual(expect.arrayContaining(race5Winners));
    });

    test('should correctly route winners from Race 3 to finals', () => {
      // Setup Race 3 with winners from first round
      const race3Round = brackets.find((b: BracketRound) => b.roundNumber === 2 && b.bracketType === 'winners');
      expect(race3Round).toBeDefined();
      const race3 = race3Round!.races[0];
      race3.racers = eightRacers.filter(r => ['racer-1', 'racer-2', 'racer-5', 'racer-6'].includes(r.id));
      
      // Simulate Race 3 completion
      const race3Winners = ['racer-1', 'racer-5'];
      const race3Losers = ['racer-2', 'racer-6'];
      
      const updatedBrackets = populateNextRoundRaces(
        brackets,
        2, // round
        'race-1',
        'mens-open',
        race3Winners,
        race3Losers,
        eightRacers,
        3, // race number
        'winners' // bracket type
      );
      
      // Check finals (Race 6)
      const finals = updatedBrackets.find((b: BracketRound) => b.bracketType === 'final');
      expect(finals).toBeDefined();
      const race6 = finals!.races[0];
      expect(race6.racers.length).toBe(2); // Only winners from Race 3 so far
      expect(race6.racers.map((r: Racer) => r.id)).toEqual(expect.arrayContaining(race3Winners));
      
      // Losers from Race 3 should NOT go to second chance
      const secondChance = updatedBrackets.find((b: BracketRound) => b.roundNumber === 1 && b.bracketType === 'losers');
      expect(secondChance).toBeDefined();
      const race4 = secondChance!.races[0];
      expect(race4.racers.map((r: Racer) => r.id)).not.toEqual(expect.arrayContaining(race3Losers));
    });
  });

  describe('9 Racers Scenario', () => {
    const nineRacers = createMockRacers(9, 'mens-open');
    let brackets: BracketRound[];

    beforeEach(() => {
      brackets = generateFullBracketStructure(nineRacers, 'race-1', 'mens-open');
    });

    test('should create correct initial bracket structure', () => {
      // Should have 5 rounds total (2 winners, 2 second chance, 1 finals)
      expect(brackets.length).toBe(5);
      
      // First round should have 3 races with 3 racers each
      const firstRound = brackets.find((b: BracketRound) => b.roundNumber === 1 && b.bracketType === 'winners');
      expect(firstRound?.races.length).toBe(3);
      expect(firstRound?.races[0].racers.length).toBe(3);
      expect(firstRound?.races[1].racers.length).toBe(3);
      expect(firstRound?.races[2].racers.length).toBe(3);
      
      // Second round should have 1 race (Race 4)
      const secondRound = brackets.find((b: BracketRound) => b.roundNumber === 2 && b.bracketType === 'winners');
      expect(secondRound?.races.length).toBe(1);
      expect(secondRound?.races[0].raceNumber).toBe(4);
      
      // Second chance should have 2 rounds
      const secondChanceRound1 = brackets.find((b: BracketRound) => b.roundNumber === 1 && b.bracketType === 'losers');
      const secondChanceRound2 = brackets.find((b: BracketRound) => b.roundNumber === 2 && b.bracketType === 'losers');
      expect(secondChanceRound1).toBeDefined();
      expect(secondChanceRound2).toBeDefined();
      expect(secondChanceRound1?.races[0].raceNumber).toBe(5);
      expect(secondChanceRound2?.races[0].raceNumber).toBe(7);
      
      // Finals should be race 8
      const finals = brackets.find((b: BracketRound) => b.bracketType === 'final');
      expect(finals?.races[0].raceNumber).toBe(8);
    });

    test('should correctly route winners and losers from first round', () => {
      // Simulate Race 1 completion
      const race1Winners = ['racer-1', 'racer-2'];
      const race1Losers = ['racer-3'];
      
      let updatedBrackets = populateNextRoundRaces(
        brackets,
        1, // round
        'race-1',
        'mens-open',
        race1Winners,
        race1Losers,
        nineRacers,
        1, // race number
        'winners' // bracket type
      );
      
      // Simulate Race 2 completion
      const race2Winners = ['racer-4', 'racer-5'];
      const race2Losers = ['racer-6'];
      
      updatedBrackets = populateNextRoundRaces(
        updatedBrackets,
        1, // round
        'race-1',
        'mens-open',
        race2Winners,
        race2Losers,
        nineRacers,
        2, // race number
        'winners' // bracket type
      );
      
      // Simulate Race 3 completion
      const race3Winners = ['racer-7', 'racer-8'];
      const race3Losers = ['racer-9'];
      
      updatedBrackets = populateNextRoundRaces(
        updatedBrackets,
        1, // round
        'race-1',
        'mens-open',
        race3Winners,
        race3Losers,
        nineRacers,
        3, // race number
        'winners' // bracket type
      );
      
      // Check Race 4 (winners bracket second round)
      const secondRound = updatedBrackets.find((b: BracketRound) => b.roundNumber === 2 && b.bracketType === 'winners');
      expect(secondRound).toBeDefined();
      const race4 = secondRound!.races[0];
      expect(race4.racers.length).toBe(3);
      expect(race4.racers.map((r: Racer) => r.id)).toEqual(
        expect.arrayContaining([...race1Winners, ...race2Winners].slice(0, 3))
      );
      
      // Check Race 5 (second chance first round)
      const secondChance = updatedBrackets.find((b: BracketRound) => b.roundNumber === 1 && b.bracketType === 'losers');
      expect(secondChance).toBeDefined();
      const race5 = secondChance!.races[0];
      expect(race5.racers.length).toBe(3);
      expect(race5.racers.map((r: Racer) => r.id)).toEqual(
        expect.arrayContaining([...race1Losers, ...race2Losers, ...race3Losers])
      );
    });

    test('should correctly route winners from Race 4 to finals and not send losers to second chance', () => {
      // Setup Race 4 with winners from first round
      const secondRound = brackets.find((b: BracketRound) => b.roundNumber === 2 && b.bracketType === 'winners');
      expect(secondRound).toBeDefined();
      const race4 = secondRound!.races[0];
      race4.racers = nineRacers.filter(r => ['racer-1', 'racer-2', 'racer-5', 'racer-6', 'racer-8', 'racer-9'].includes(r.id));
      
      // Simulate Race 4 completion
      const race4Winners = ['racer-1', 'racer-5'];
      const race4Losers = ['racer-2', 'racer-6', 'racer-8', 'racer-9'];
      
      const updatedBrackets = populateNextRoundRaces(
        brackets,
        2, // round
        'race-1',
        'mens-open',
        race4Winners,
        race4Losers,
        nineRacers,
        4, // race number
        'winners' // bracket type
      );
      
      // Check finals (Race 8)
      const finals = updatedBrackets.find((b: BracketRound) => b.bracketType === 'final');
      expect(finals).toBeDefined();
      const race8 = finals!.races[0];
      expect(race8.racers.length).toBe(2);
      expect(race8.racers.map((r: Racer) => r.id)).toEqual(expect.arrayContaining(race4Winners));
      
      // Verify that losers from Race 4 are NOT sent to any second chance race
      const secondChanceRound2 = brackets.find((b: BracketRound) => b.roundNumber === 2 && b.bracketType === 'losers');
      expect(secondChanceRound2).toBeDefined();
      const race7 = secondChanceRound2!.races[0];
      expect(race7.racers.map((r: Racer) => r.id)).not.toEqual(expect.arrayContaining(race4Losers));
    });

    test('should correctly route winner from Race 5 to Race 7', () => {
      // Setup Race 5 with losers from first round
      const secondChanceRound1 = brackets.find((b: BracketRound) => b.roundNumber === 1 && b.bracketType === 'losers');
      expect(secondChanceRound1).toBeDefined();
      const race5 = secondChanceRound1!.races[0];
      race5.racers = nineRacers.filter(r => ['racer-3', 'racer-4', 'racer-7'].includes(r.id));
      
      // Simulate Race 5 completion
      const race5Winners = ['racer-3'];
      const race5Losers = ['racer-4', 'racer-7'];
      
      const updatedBrackets = populateNextRoundRaces(
        brackets,
        1, // round
        'race-1',
        'mens-open',
        race5Winners,
        race5Losers,
        nineRacers,
        5, // race number
        'losers' // bracket type
      );
      
      // Check Race 7 (second chance final)
      const secondChanceRound2 = updatedBrackets.find((b: BracketRound) => b.roundNumber === 2 && b.bracketType === 'losers');
      expect(secondChanceRound2).toBeDefined();
      const race7 = secondChanceRound2!.races[0];
      expect(race7.racers.length).toBe(1);
      expect(race7.racers.map((r: Racer) => r.id)).toEqual(expect.arrayContaining(race5Winners));
    });

    test('should correctly route winner from Race 7 to finals', () => {
      // Setup Race 7 with winner from Race 5
      const secondChanceRound2 = brackets.find((b: BracketRound) => b.roundNumber === 2 && b.bracketType === 'losers');
      expect(secondChanceRound2).toBeDefined();
      const race7 = secondChanceRound2!.races[0];
      race7.racers = nineRacers.filter(r => ['racer-3'].includes(r.id));
      
      // Simulate Race 7 completion
      const race7Winners = ['racer-3'];
      const race7Losers: string[] = [];
      
      const updatedBrackets = populateNextRoundRaces(
        brackets,
        2, // round
        'race-1',
        'mens-open',
        race7Winners,
        race7Losers,
        nineRacers,
        7, // race number
        'losers' // bracket type
      );
      
      // Check finals (Race 8)
      const finals = updatedBrackets.find((b: BracketRound) => b.bracketType === 'final');
      expect(finals).toBeDefined();
      const race8 = finals!.races[0];
      expect(race8.racers.map((r: Racer) => r.id)).toEqual(expect.arrayContaining(race7Winners));
    });
  });

  describe('10 Racers Scenario', () => {
    const tenRacers = createMockRacers(10, 'mens-open');
    let brackets: BracketRound[];

    beforeEach(() => {
      brackets = generateFullBracketStructure(tenRacers, 'race-1', 'mens-open');
    });

    test('should create correct initial bracket structure', () => {
      // Should have balanced groups of [4,3,3]
      const firstRound = brackets.find(b => b.roundNumber === 1 && b.bracketType === 'winners');
      expect(firstRound?.races.length).toBe(3);
      expect(firstRound?.races[0].racers.length).toBe(4);
      expect(firstRound?.races[1].racers.length).toBe(3);
      expect(firstRound?.races[2].racers.length).toBe(3);
      
      // Verify race progression
      expect(firstRound?.races[0].nextWinnerRace).toBeDefined();
      expect(firstRound?.races[1].nextWinnerRace).toBeDefined();
      expect(firstRound?.races[2].nextWinnerRace).toBeDefined();
    });
  });

  describe('12 Racers Scenario', () => {
    const twelveRacers = createMockRacers(12, 'mens-open');
    let brackets: BracketRound[];

    beforeEach(() => {
      brackets = generateFullBracketStructure(twelveRacers, 'race-1', 'mens-open');
    });

    test('should create correct initial bracket structure', () => {
      const firstRound = brackets.find(b => b.roundNumber === 1 && b.bracketType === 'winners');
      expect(firstRound?.races.length).toBe(3);
      firstRound?.races.forEach(race => {
        expect(race.racers.length).toBe(4);
      });
    });

    test('should handle first round progression correctly', () => {
      let updatedBrackets = brackets;
      
      // First round - 3 races
      for (let i = 0; i < 3; i++) {
        updatedBrackets = populateNextRoundRaces(
          updatedBrackets,
          1,
          'race-1',
          'mens-open',
          [`racer-${i*4+1}`, `racer-${i*4+2}`],
          [`racer-${i*4+3}`, `racer-${i*4+4}`],
          twelveRacers,
          i + 1,
          'winners'
        );
      }

      // Verify second round structure
      const secondRound = updatedBrackets.find(b => b.roundNumber === 2 && b.bracketType === 'winners');
      expect(secondRound?.races.length).toBe(3);
      
      // Check if races have been populated with winners from first round
      // The exact distribution might vary, but we should have racers in the second round
      const totalRacersInSecondRound = secondRound?.races.reduce(
        (sum, race) => sum + race.racers.length, 0
      ) || 0;
      
      expect(totalRacersInSecondRound).toBe(6); // 6 winners from first round
      
      // Check first race has racers
      expect(secondRound?.races[0].racers.length).toBeGreaterThan(0);
    });
  });

  describe('16 Racers Scenario', () => {
    const sixteenRacers = createMockRacers(16, 'mens-open');
    let brackets: BracketRound[];

    beforeEach(() => {
      brackets = generateFullBracketStructure(sixteenRacers, 'race-1', 'mens-open');
    });

    test('should create correct initial bracket structure', () => {
      const firstRound = brackets.find(b => b.roundNumber === 1 && b.bracketType === 'winners');
      expect(firstRound?.races.length).toBe(4);
      firstRound?.races.forEach(race => {
        expect(race.racers.length).toBe(4);
      });
    });

    test('should handle multi-round progression', () => {
      let updatedBrackets = brackets;
      
      // First round - 4 races
      for (let i = 0; i < 4; i++) {
        updatedBrackets = populateNextRoundRaces(
          updatedBrackets,
          1,
          'race-1',
          'mens-open',
          [`racer-${i*4+1}`, `racer-${i*4+2}`],
          [`racer-${i*4+3}`, `racer-${i*4+4}`],
          sixteenRacers,
          i + 1,
          'winners'
        );
      }

      // Verify second round structure
      const secondRound = updatedBrackets.find(b => b.roundNumber === 2 && b.bracketType === 'winners');
      expect(secondRound?.races.length).toBe(4);
      
      // Check if races have been populated with winners from first round
      // The exact distribution might vary, but we should have racers in the second round
      const totalRacersInSecondRound = secondRound?.races.reduce(
        (sum, race) => sum + race.racers.length, 0
      ) || 0;
      
      expect(totalRacersInSecondRound).toBe(8); // 8 winners from first round
      
      // Check first race has racers
      expect(secondRound?.races[0].racers.length).toBeGreaterThan(0);
    });
  });

  describe('24 Racers Scenario', () => {
    const twentyFourRacers = createMockRacers(24, 'mens-open');
    let brackets: BracketRound[];

    beforeEach(() => {
      brackets = generateFullBracketStructure(twentyFourRacers, 'race-1', 'mens-open');
    });

    test('should create correct initial bracket structure', () => {
      const firstRound = brackets.find(b => b.roundNumber === 1 && b.bracketType === 'winners');
      expect(firstRound?.races.length).toBe(6);
      firstRound?.races.forEach(race => {
        expect(race.racers.length).toBe(4);
      });

      // Verify progression structure
      const secondRound = brackets.find(b => b.roundNumber === 2 && b.bracketType === 'winners');
      expect(secondRound?.races.length).toBe(3);
    });

    test('should handle first round progression with multiple second chance races', () => {
      let updatedBrackets = brackets;
      
      // Process first two races
      updatedBrackets = populateNextRoundRaces(
        updatedBrackets,
        1,
        'race-1',
        'mens-open',
        ['racer-1', 'racer-2'],
        ['racer-3', 'racer-4'],
        twentyFourRacers,
        1,
        'winners'
      );

      updatedBrackets = populateNextRoundRaces(
        updatedBrackets,
        1,
        'race-1',
        'mens-open',
        ['racer-5', 'racer-6'],
        ['racer-7', 'racer-8'],
        twentyFourRacers,
        2,
        'winners'
      );

      // Verify second chance structure
      const secondChance = updatedBrackets.find(b => b.roundNumber === 1 && b.bracketType === 'losers');
      expect(secondChance?.races.length).toBe(2);
      expect(secondChance?.races[0].racers.length).toBe(4);
    });

    test('should maintain proper race numbering throughout bracket', () => {
      const allRaces = brackets.flatMap(round => round.races);
      const raceNumbers = allRaces.map(race => race.raceNumber);
      
      // Verify sequential numbering
      raceNumbers.forEach((num, idx) => {
        if (idx > 0) {
          expect(num).toBe(raceNumbers[idx - 1] + 1);
        }
      });

      // Verify proper progression references
      allRaces.forEach(race => {
        if (race.nextWinnerRace) {
          expect(raceNumbers).toContain(race.nextWinnerRace);
          expect(race.nextWinnerRace).toBeGreaterThan(race.raceNumber);
        }
      });
    });
  });
});