const { canonicalColors, jarCapacity, ballsPerColor, jarCount } = require('../../lib/gameConfig.json');

const permutations = (items) => {
	if (items.length <= 1) {
		return [items];
	}

	return items.flatMap((item, index) => permutations([...items.slice(0, index), ...items.slice(index + 1)]).map((restItems) => [item, ...restItems]));
};

const canonicalColorPermutations = permutations(canonicalColors);

const canonicalizeJars = (jars) => {
	const sortedJars = jars.map((jar) => jar.join('')).sort();
	const colorMap = new Map();
	let nextColorIndex = 0;

	return sortedJars
		.map((jar) =>
			[...jar]
				.map((color) => {
					if (!colorMap.has(color)) {
						colorMap.set(color, canonicalColors[nextColorIndex]);
						nextColorIndex += 1;
					}

					return colorMap.get(color);
				})
				.join('')
		)
		.join('|');
};

const deserializeCanonicalJars = (stateKey) => stateKey.split('|').map((jar) => [...jar]);

const getCanonicalNextStates = (stateKey) => {
	const jars = deserializeCanonicalJars(stateKey);
	const nextStates = [];

	for (let sourceJar = 0; sourceJar < jarCount; sourceJar += 1) {
		if (jars[sourceJar].length === 0) {
			continue;
		}

		for (let targetJar = 0; targetJar < jarCount; targetJar += 1) {
			if (sourceJar === targetJar || jars[targetJar].length >= jarCapacity) {
				continue;
			}

			const nextJars = jars.map((jar) => [...jar]);
			const movingBall = nextJars[sourceJar].pop();

			nextJars[targetJar].push(movingBall);
			nextStates.push(canonicalizeJars(nextJars));
		}
	}

	return nextStates;
};

const createCanonicalSolvedLevel = () => canonicalizeJars([...canonicalColors.map((color) => Array.from({ length: ballsPerColor }, () => color)), []]);

const buildExactDistanceBuckets = (wantedTurns) => {
	const maxTurns = Math.max(...wantedTurns);
	const buckets = new Map([...wantedTurns].map((minimumTurns) => [minimumTurns, []]));
	const seenStates = new Set([createCanonicalSolvedLevel()]);
	let frontier = [...seenStates];

	for (let turns = 1; turns <= maxTurns; turns += 1) {
		const nextFrontier = [];

		frontier.forEach((stateKey) => {
			getCanonicalNextStates(stateKey).forEach((nextStateKey) => {
				if (seenStates.has(nextStateKey)) {
					return;
				}

				seenStates.add(nextStateKey);
				nextFrontier.push(nextStateKey);
			});
		});

		if (buckets.has(turns)) {
			buckets.set(turns, nextFrontier);
		}

		console.log(`Solved exact ${turns}-move states: ${nextFrontier.length}`);
		frontier = nextFrontier;
	}

	return buckets;
};

const buildExactDistanceLookup = (maxTurns) => {
	const solvedLevel = createCanonicalSolvedLevel();
	const distances = new Map([[solvedLevel, 0]]);
	let frontier = [solvedLevel];

	for (let turns = 1; turns <= maxTurns; turns += 1) {
		const nextFrontier = [];

		frontier.forEach((stateKey) => {
			getCanonicalNextStates(stateKey).forEach((nextStateKey) => {
				if (distances.has(nextStateKey)) {
					return;
				}

				distances.set(nextStateKey, turns);
				nextFrontier.push(nextStateKey);
			});
		});

		console.log(`Indexed exact ${turns}-move states: ${nextFrontier.length}`);
		frontier = nextFrontier;
	}

	return distances;
};

const getPossibleCanonicalKeys = (jars, colors) =>
	canonicalColorPermutations.map((permutation) => {
		const colorMap = new Map(colors.map((color, index) => [color, permutation[index]]));

		return canonicalizeJars(jars.map((jar) => jar.map((color) => colorMap.get(color))));
	});

const getExactMinimumTurns = (level, distances, colors) => {
	const matchingDistances = getPossibleCanonicalKeys(level.jars, colors)
		.map((stateKey) => distances.get(stateKey))
		.filter((distance) => distance !== undefined);

	if (matchingDistances.length === 0) {
		throw new Error(`Unable to resolve exact distance for level ${level.key}`);
	}

	return Math.min(...matchingDistances);
};

module.exports = {
	buildExactDistanceBuckets,
	buildExactDistanceLookup,
	canonicalizeJars,
	deserializeCanonicalJars,
	getExactMinimumTurns,
};
