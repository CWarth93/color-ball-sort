import { ballsPerColor, jarCapacity } from './gameConfig';

export type Jars = string[][];

export const cloneJars = (jars: Jars) => jars.map((jar) => [...jar]);

export const getTopBall = (jars: Jars, jarIndex: number) => jars[jarIndex]?.[jars[jarIndex].length - 1] ?? null;

export const isLevelSolved = (jars: Jars) =>
	jars.every((jar) => {
		if (jar.length === 0) {
			return true;
		}

		return jar.length === ballsPerColor && jar.every((color) => color === jar[0]);
	});

export const canDropBall = (jars: Jars, sourceJar: number | null, targetJar: number) => {
	if (sourceJar === null || sourceJar === targetJar || !jars[sourceJar] || !jars[targetJar]) {
		return false;
	}

	return jars[sourceJar].length > 0 && jars[targetJar].length < jarCapacity;
};

export const applyMove = (jars: Jars, sourceJar: number, targetJar: number) => {
	if (!canDropBall(jars, sourceJar, targetJar)) {
		return null;
	}

	const nextJars = cloneJars(jars);
	const movingBall = nextJars[sourceJar].pop();

	if (!movingBall) {
		return null;
	}

	nextJars[targetJar].push(movingBall);

	return nextJars;
};
