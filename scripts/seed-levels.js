const { MongoClient } = require('mongodb');
const { existsSync, readFileSync } = require('fs');
const { join } = require('path');

const colors = ['#ff5a6f', '#ffd166', '#49c6e5', '#65d46e', '#a78bfa'];
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
	{ difficulty: 'easy', minimumTurns: 6, count: 10 },
	{ difficulty: 'medium', minimumTurns: 8, count: 10 },
	{ difficulty: 'hard', minimumTurns: 9, count: 10 },
];

const shuffle = (items) => {
	const shuffledItems = [...items];

	for (let index = shuffledItems.length - 1; index > 0; index -= 1) {
		const swapIndex = Math.floor(Math.random() * (index + 1));
		[shuffledItems[index], shuffledItems[swapIndex]] = [shuffledItems[swapIndex], shuffledItems[index]];
	}

	return shuffledItems;
};

const cloneJars = (jars) => jars.map((jar) => [...jar]);

const serializeJars = (jars) => jars.map((jar) => jar.join(',')).join('|');

const hasMixedJar = (jars) => jars.some((jar) => new Set(jar).size > 1);

const createSolvedLevel = () => [...colors.map((color) => Array.from({ length: ballsPerColor }, () => color)), []];

const createJarAssignments = () => {
	const assign = (remainingColors) => {
		if (remainingColors.length === 1) {
			return [remainingColors];
		}

		return remainingColors.flatMap((color, colorIndex) =>
			assign([...remainingColors.slice(0, colorIndex), ...remainingColors.slice(colorIndex + 1)]).map((nextColors) => [color, ...nextColors])
		);
	};

	return Array.from({ length: jarCount }, (_, emptyJarIndex) => assign(colors).map((assignedColors) => ({ assignedColors, emptyJarIndex }))).flat();
};

const jarAssignments = createJarAssignments();

const calculateRequiredMoveLowerBound = (jars) => {
	let mostBallsAlreadyInFinalJars = 0;

	jarAssignments.forEach(({ assignedColors, emptyJarIndex }) => {
		let keptBalls = 0;
		let colorIndex = 0;

		for (let jarIndex = 0; jarIndex < jarCount; jarIndex += 1) {
			if (jarIndex === emptyJarIndex) {
				continue;
			}

			const assignedColor = assignedColors[colorIndex];
			keptBalls += jars[jarIndex].filter((color) => color === assignedColor).length;
			colorIndex += 1;
		}

		mostBallsAlreadyInFinalJars = Math.max(mostBallsAlreadyInFinalJars, keptBalls);
	});

	return colors.length * ballsPerColor - mostBallsAlreadyInFinalJars;
};

const createScrambledLevel = (minimumTurns) => {
	let nextJars = createSolvedLevel();
	const seenStates = new Set([serializeJars(nextJars)]);

	for (let turn = 0; turn < minimumTurns; turn += 1) {
		const candidates = [];

		for (let sourceJar = 0; sourceJar < jarCount; sourceJar += 1) {
			if (nextJars[sourceJar].length === 0) {
				continue;
			}

			for (let targetJar = 0; targetJar < jarCount; targetJar += 1) {
				if (sourceJar === targetJar || nextJars[targetJar].length >= jarCapacity) {
					continue;
				}

				const candidateJars = cloneJars(nextJars);
				const movingBall = candidateJars[sourceJar].pop();

				if (!movingBall) {
					continue;
				}

				candidateJars[targetJar].push(movingBall);

				const stateKey = serializeJars(candidateJars);
				if (!seenStates.has(stateKey) && calculateRequiredMoveLowerBound(candidateJars) === turn + 1) {
					candidates.push(candidateJars);
				}
			}
		}

		if (candidates.length === 0) {
			return null;
		}

		nextJars = shuffle(candidates)[0];
		seenStates.add(serializeJars(nextJars));
	}

	return nextJars;
};

const createLevel = (difficulty, minimumTurns, usedKeys) => {
	for (let attempt = 0; attempt < 500; attempt += 1) {
		const jars = createScrambledLevel(minimumTurns);

		if (!jars || !hasMixedJar(jars)) {
			continue;
		}

		const key = serializeJars(jars);
		const lowerBound = calculateRequiredMoveLowerBound(jars);

		if (lowerBound !== minimumTurns || usedKeys.has(key)) {
			continue;
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
	}

	throw new Error(`Unable to generate a unique ${difficulty} level with ${minimumTurns} turns`);
};

const main = async () => {
	loadLocalEnv();

	const uri = process.env.MONGODB_URI;

	if (!uri) {
		throw new Error('MONGODB_URI is not configured');
	}

	const usedKeys = new Set();
	const levels = levelPlan.flatMap(({ difficulty, minimumTurns, count }) =>
		Array.from({ length: count }, () => createLevel(difficulty, minimumTurns, usedKeys))
	);
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
