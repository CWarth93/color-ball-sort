const { MongoClient } = require('mongodb');
const { ballsPerColor, canonicalColors, databaseName, jarCapacity, levelsCollectionName, logicalColors } = require('../lib/gameConfig.json');
const { loadLocalEnv } = require('./lib/load-env');
const { buildExactDistanceBuckets, deserializeCanonicalJars } = require('./lib/solver');

const levelPlan = [
	{ difficulty: 'easy', minimumTurns: [6, 7, 8], count: 10 },
	{ difficulty: 'easy', minimumTurns: [9, 10], count: 5 },
	{ difficulty: 'medium', minimumTurns: [11, 12, 13], count: 10 },
	{ difficulty: 'medium', minimumTurns: [14, 15], count: 3 },
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

const createLevelFromCanonicalState = (canonicalStateKey, difficulty, minimumTurns, usedKeys) => {
	const shuffledColors = shuffle(logicalColors);
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
		colors: logicalColors,
		createdAt: new Date(),
	};
};

const createLevels = () => {
	const wantedTurns = new Set(levelPlan.flatMap((plan) => plan.minimumTurns));
	const buckets = buildExactDistanceBuckets(wantedTurns);
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
		const collection = client.db(databaseName).collection(levelsCollectionName);

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
