import '@testing-library/jest-dom';
import { generateFullBracketStructure, populateNextRoundRaces, BracketRound } from '../features/bracketSlice';
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
      expect(race4.racers.length).toBe(6);
      expect(race4.racers.map((r: Racer) => r.id)).toEqual(
        expect.arrayContaining([...race1Winners, ...race2Winners, ...race3Winners])
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
});