import { MongoClient } from 'mongodb';
import type { Collection } from 'mongodb';

import type { StoredLevel } from './levelTypes';
import { databaseName, levelsCollectionName } from './gameConfig';

let clientPromise: Promise<MongoClient> | null = null;

const getMongoClient = () => {
	const uri = process.env.MONGODB_URI ?? process.env.MONGODB_CONNECTION_STRING;

	if (!uri) {
		throw new Error('MongoDB connection string is not configured');
	}

	if (!clientPromise) {
		clientPromise = new MongoClient(uri).connect();
	}

	return clientPromise;
};

export const getLevelsCollection = async (): Promise<Collection<StoredLevel>> => {
	const client = await getMongoClient();

	return client.db(databaseName).collection<StoredLevel>(levelsCollectionName);
};
