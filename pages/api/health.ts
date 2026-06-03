import type { NextApiRequest, NextApiResponse } from 'next';

type HealthResponse = {
	status: 'ok';
	app: 'color-ball-sort';
};

export default function handler(_req: NextApiRequest, res: NextApiResponse<HealthResponse>) {
	res.status(200).json({ status: 'ok', app: 'color-ball-sort' });
}
