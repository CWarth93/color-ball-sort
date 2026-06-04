import { applyMove, canDropBall, cloneJars, getTopBall, isLevelSolved } from '../../lib/gameRules';

describe('game rules', () => {
	it('detects solved levels when every jar is full with one color or empty', () => {
		expect(isLevelSolved([['red', 'red', 'red'], ['blue', 'blue', 'blue'], []])).to.equal(true);
		expect(isLevelSolved([['red', 'red'], ['blue', 'blue', 'blue'], []])).to.equal(false);
		expect(isLevelSolved([['red', 'blue', 'red'], ['blue', 'blue', 'blue'], []])).to.equal(false);
	});

	it('clones jar arrays without sharing nested arrays', () => {
		const jars = [['red'], ['blue']];
		const clonedJars = cloneJars(jars);

		clonedJars[0].push('green');

		expect(jars[0]).to.deep.equal(['red']);
		expect(clonedJars[0]).to.deep.equal(['red', 'green']);
	});

	it('returns the current top ball from a jar', () => {
		expect(getTopBall([['red', 'blue'], []], 0)).to.equal('blue');
		expect(getTopBall([['red', 'blue'], []], 1)).to.equal(null);
		expect(getTopBall([['red', 'blue'], []], 8)).to.equal(null);
	});

	it('allows moving from a non-empty source into a jar with free space', () => {
		const jars = [['red', 'blue'], ['green']];

		expect(canDropBall(jars, 0, 1)).to.equal(true);
		expect(applyMove(jars, 0, 1)).to.deep.equal([['red'], ['green', 'blue']]);
		expect(jars).to.deep.equal([['red', 'blue'], ['green']]);
	});

	it('rejects moves into the same jar, full jars, empty sources, and missing jars', () => {
		const jars = [['red'], ['blue', 'green', 'yellow'], []];

		expect(canDropBall(jars, 0, 0)).to.equal(false);
		expect(canDropBall(jars, 0, 1)).to.equal(false);
		expect(canDropBall(jars, 2, 0)).to.equal(false);
		expect(canDropBall(jars, null, 0)).to.equal(false);
		expect(canDropBall(jars, 0, 99)).to.equal(false);
		expect(applyMove(jars, 0, 0)).to.equal(null);
		expect(applyMove(jars, 0, 1)).to.equal(null);
		expect(applyMove(jars, 2, 0)).to.equal(null);
	});
});
