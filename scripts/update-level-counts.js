const { MongoClient } = require('mongodb');
const { existsSync, readFileSync } = require('fs');
const { join } = require('path');

const colors = ['#ff5a6f', '#ffd166', '#49c6e5', '#65d46e', '#a78bfa'];
const canonicalColors = ['A', 'B', 'C', 'D', 'E'];
const jarCapacity = 3;
const ballsPerColor = 3;
const jarCount = 6;
const databaseName = 'color_ball_sort';
const collectionName = 'levels';

const loadLocalEnv = () => {
	const envPath = join(process.cwd(), '.env');

	if (!existsSync(envPath)) {
		return;
	}

	readFileSync(envPath, 'utf8')
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter((line) => line && !line.startsWith('#'))
		.forEach((line) => {
			const separatorIndex = line.indexOf('=');

			if (separatorIndex === -1) {
				return;
			}

			process.env[line.slice(0, separatorIndex)] ??= line.slice(separatorIndex + 1);
		});
};

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

const buildExactDistanceLookup = (maxTurns) => {
	const distances = new Map([[createCanonicalSolvedLevel(), 0]]);
	let frontier = [createCanonicalSolvedLevel()];

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

const getPossibleCanonicalKeys = (jars) =>
	canonicalColorPermutations.map((permutation) => {
		const colorMap = new Map(colors.map((color, index) => [color, permutation[index]]));

		return canonicalizeJars(jars.map((jar) => jar.map((color) => colorMap.get(color))));
	});

const getExactMinimumTurns = (level, distances) => {
	const matchingDistances = getPossibleCanonicalKeys(level.jars)
		.map((stateKey) => distances.get(stateKey))
		.filter((distance) => distance !== undefined);

	if (matchingDistances.length === 0) {
		throw new Error(`Unable to resolve exact distance for level ${level.key}`);
	}

	return Math.min(...matchingDistances);
};

const main = async () => {
	loadLocalEnv();

	if (!process.env.MONGODB_URI) {
		throw new Error('MONGODB_URI is not configured');
	}

	const client = new MongoClient(process.env.MONGODB_URI);

	await client.connect();
	try {
		const collection = client.db(databaseName).collection(collectionName);
		const levels = await collection.find({}).toArray();
		const maxStoredTurns = Math.max(...levels.map((level) => level.minimumTurns));
		const distances = buildExactDistanceLookup(maxStoredTurns);
		const updates = [];

		for (const level of levels) {
			const exactMinimumTurns = getExactMinimumTurns(level, distances);

			if (level.minimumTurns !== exactMinimumTurns || level.fastPathCount !== exactMinimumTurns) {
				updates.push({
					updateOne: {
						filter: { _id: level._id },
						update: {
							$set: {
								minimumTurns: exactMinimumTurns,
								fastPathCount: exactMinimumTurns,
								updatedAt: new Date(),
							},
						},
					},
				});
				console.log(`${level.difficulty}: ${level.minimumTurns} -> ${exactMinimumTurns} ${level.key}`);
			}
		}

		if (updates.length > 0) {
			await collection.bulkWrite(updates);
		}

		const counts = await collection
			.aggregate([{ $group: { _id: '$difficulty', count: { $sum: 1 }, minTurns: { $min: '$minimumTurns' }, maxTurns: { $max: '$minimumTurns' } } }])
			.toArray();

		console.log(JSON.stringify({ checked: levels.length, updated: updates.length, counts }, null, 2));
	} finally {
		await client.close();
	}
};

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
