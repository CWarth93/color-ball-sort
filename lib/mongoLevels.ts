import { MongoClient } from 'mongodb';
import type { Collection } from 'mongodb';

import type { StoredLevel } from './levelTypes';

const databaseName = 'color_ball_sort';
const collectionName = 'levels';

let clientPromise: Promise<MongoClient> | null = null;

const getMongoClient = () => {
	const uri = process.env.MONGODB_URI;

	if (!uri) {
		throw new Error('MONGODB_URI is not configured');
	}

	if (!clientPromise) {
		clientPromise = new MongoClient(uri).connect();
	}

	return clientPromise;
};

export const getLevelsCollection = async (): Promise<Collection<StoredLevel>> => {
	const client = await getMongoClient();

	return client.db(databaseName).collection<StoredLevel>(collectionName);
};
