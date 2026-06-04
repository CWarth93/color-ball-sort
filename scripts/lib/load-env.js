const { existsSync, readFileSync } = require('fs');
const { join } = require('path');

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

module.exports = { loadLocalEnv };
