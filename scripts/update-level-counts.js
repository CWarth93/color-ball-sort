const { MongoClient } = require('mongodb');
const { databaseName, levelsCollectionName, logicalColors } = require('../lib/gameConfig.json');
const { loadLocalEnv } = require('./lib/load-env');
const { buildExactDistanceLookup, getExactMinimumTurns } = require('./lib/solver');

const main = async () => {
	loadLocalEnv();

	if (!process.env.MONGODB_URI) {
		throw new Error('MONGODB_URI is not configured');
	}

	const client = new MongoClient(process.env.MONGODB_URI);

	await client.connect();
	try {
		const collection = client.db(databaseName).collection(levelsCollectionName);
		const levels = await collection.find({}).toArray();
		const maxStoredTurns = Math.max(...levels.map((level) => level.minimumTurns));
		const distances = buildExactDistanceLookup(maxStoredTurns);
		const updates = [];

		for (const level of levels) {
			const exactMinimumTurns = getExactMinimumTurns(level, distances, level.colors ?? logicalColors);

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
