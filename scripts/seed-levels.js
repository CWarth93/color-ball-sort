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

			const key = line.slice(0, separatorIndex);
			const value = line.slice(separatorIndex + 1);

			process.env[key] ??= value;
		});
};

const levelPlan = [
	{ difficulty: 'easy', minimumTurns: [6, 7, 8], count: 10 },
	{ difficulty: 'medium', minimumTurns: [11, 12, 13], count: 10 },
	{ difficulty: 'hard', minimumTurns: [16, 17, 18, 19], count: 10 },
];

const shuffle = (items) => {
	const shuffledItems = [...items];

	for (let index = shuffledItems.length - 1; index > 0; index -= 1) {
		const swapIndex = Math.floor(Math.random() * (index + 1));
		[shuffledItems[index], shuffledItems[swapIndex]] = [shuffledItems[swapIndex], shuffledItems[index]];
	}

	return shuffledItems;
};

const serializeJars = (jars) => jars.map((jar) => jar.join(',')).join('|');

const deserializeCanonicalJars = (key) => key.split('|').map((jar) => [...jar]);

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

const createCanonicalSolvedLevel = () =>
	canonicalizeJars([...canonicalColors.map((color) => Array.from({ length: ballsPerColor }, () => color)), []]);

const buildExactDistanceBuckets = () => {
	const wantedTurns = new Set(levelPlan.flatMap((plan) => plan.minimumTurns));
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

const createLevelFromCanonicalState = (canonicalStateKey, difficulty, minimumTurns, usedKeys) => {
	const shuffledColors = shuffle(colors);
	const colorMap = new Map(canonicalColors.map((color, index) => [color, shuffledColors[index]]));
	const jars = shuffle(
		deserializeCanonicalJars(canonicalStateKey).map((jar) =>
			jar.map((color) => {
				const mappedColor = colorMap.get(color);

				if (!mappedColor) {
					throw new Error(`Unknown canonical color ${color}`);
				}

				return mappedColor;
			})
		)
	);
	const key = serializeJars(jars);

	if (usedKeys.has(key)) {
		return null;
	}

	usedKeys.add(key);

	return {
		key,
		difficulty,
		minimumTurns,
		fastPathCount: minimumTurns,
		jars,
		jarCapacity,
		ballsPerColor,
		colors,
		createdAt: new Date(),
	};
};

const createLevels = () => {
	const buckets = buildExactDistanceBuckets();
	const usedKeys = new Set();

	return levelPlan.flatMap(({ difficulty, minimumTurns, count }) => {
		const bucketQueues = new Map(minimumTurns.map((turns) => [turns, shuffle(buckets.get(turns))]));
		const levels = [];
		let turnIndex = 0;

		while (levels.length < count) {
			const turns = minimumTurns[turnIndex % minimumTurns.length];
			const candidates = bucketQueues.get(turns);
			const candidate = candidates.pop();

			if (!candidate) {
				throw new Error(`Unable to create ${count} ${difficulty} levels`);
			}

			const level = createLevelFromCanonicalState(candidate, difficulty, turns, usedKeys);

			if (level) {
				levels.push(level);
				turnIndex += 1;
			}
		}

		return levels;
	});
};

const main = async () => {
	loadLocalEnv();

	const uri = process.env.MONGODB_URI;

	if (!uri) {
		throw new Error('MONGODB_URI is not configured');
	}

	const levels = createLevels();
	const client = new MongoClient(uri);

	await client.connect();
	try {
		const collection = client.db(databaseName).collection(collectionName);

		await collection.deleteMany({});
		await collection.insertMany(levels);
		await collection.createIndex({ difficulty: 1 });
		await collection.createIndex({ key: 1 }, { unique: true });

		const counts = await collection
			.aggregate([{ $group: { _id: '$difficulty', count: { $sum: 1 }, minTurns: { $min: '$minimumTurns' }, maxTurns: { $max: '$minimumTurns' } } }])
			.toArray();

		console.log(JSON.stringify({ inserted: levels.length, counts }, null, 2));
	} finally {
		await client.close();
	}
};

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
