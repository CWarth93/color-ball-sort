import { MongoClient } from 'mongodb';
import type { NextApiRequest, NextApiResponse } from 'next';

type LeaderboardBody = {
	playerName?: string;
	score?: number;
	completedLevels?: number;
	moves?: number;
};

type LeaderboardResponse = {
	ok: boolean;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<LeaderboardResponse>) {
	if (req.method !== 'POST') {
		res.setHeader('Allow', 'POST');
		res.status(405).json({ ok: false });
		return;
	}

	const { playerName, score, completedLevels, moves } = req.body as LeaderboardBody;

	if (!playerName || typeof score !== 'number' || typeof completedLevels !== 'number' || typeof moves !== 'number') {
		res.status(400).json({ ok: false });
		return;
	}

	const connectionString = process.env.MONGODB_CONNECTION_STRING;

	if (!connectionString) {
		res.status(202).json({ ok: true });
		return;
	}

	const client = new MongoClient(connectionString);

	try {
		await client.connect();
		await client.db('color-ball-sort').collection('leaderboard').insertOne({
			playerName,
			score,
			completedLevels,
			moves,
			createdAt: new Date(),
		});
		res.status(201).json({ ok: true });
	} finally {
		await client.close();
	}
}
