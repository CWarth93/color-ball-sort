export type Difficulty = 'easy' | 'medium' | 'hard';

export type StoredLevel = {
	key: string;
	difficulty: Difficulty;
	minimumTurns: number;
	fastPathCount: number;
	jars: string[][];
	jarCapacity: number;
	ballsPerColor: number;
	colors: string[];
};
