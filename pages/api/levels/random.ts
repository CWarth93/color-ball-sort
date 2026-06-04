import type { NextApiRequest, NextApiResponse } from 'next';

import { getLevelsCollection } from '../../../lib/mongoLevels';
import type { StoredLevel } from '../../../lib/levelTypes';

type RandomLevelResponse =
	| {
			level: StoredLevel;
	  }
	| {
			error: string;
	  };

export default async function handler(_request: NextApiRequest, response: NextApiResponse<RandomLevelResponse>) {
	try {
		const collection = await getLevelsCollection();
		const [level] = await collection
			.aggregate<StoredLevel>([{ $sample: { size: 1 } }])
			.toArray();

		if (!level) {
			response.status(404).json({ error: 'No levels are available' });
			return;
		}

		response.status(200).json({
			level: {
				key: level.key,
				difficulty: level.difficulty,
				minimumTurns: level.minimumTurns,
				fastPathCount: level.fastPathCount,
				jars: level.jars,
				jarCapacity: level.jarCapacity,
				ballsPerColor: level.ballsPerColor,
				colors: level.colors,
			},
		});
	} catch (error) {
		response.status(500).json({ error: error instanceof Error ? error.message : 'Unable to load a level' });
	}
}
