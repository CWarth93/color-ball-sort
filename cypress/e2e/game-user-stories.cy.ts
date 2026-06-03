const selectors = {
	startSprint: '[data-testid="start-sprint"]',
	gameBoard: '[data-testid="game-board"]',
	jar: (index: number) => `[data-testid="jar-${index}"]`,
	ball: '[data-testid="ball"]',
	timer: '[data-testid="timer"]',
	completedLevels: '[data-testid="completed-levels"]',
	score: '[data-testid="score"]',
	moves: '[data-testid="moves"]',
	levelComplete: '[data-testid="level-complete"]',
	results: '[data-testid="results"]',
	finalLevels: '[data-testid="final-levels"]',
	finalScore: '[data-testid="final-score"]',
	finalMoves: '[data-testid="final-moves"]',
	settings: '[data-testid="settings"]',
	soundToggle: '[data-testid="sound-toggle"]',
	motionToggle: '[data-testid="motion-toggle"]',
	leaderboardName: '[data-testid="leaderboard-name"]',
	submitScore: '[data-testid="submit-score"]',
};

const startSprint = ({ useClock = false }: { useClock?: boolean } = {}) => {
	cy.visit('/');
	if (useClock) {
		cy.clock();
	}
	cy.window().should((win) => {
		expect(win.document.readyState).to.equal('complete');
	});
	cy.wait(500);
	cy.get(selectors.startSprint).click();
	cy.get(selectors.gameBoard).should('be.visible');
};

describe('Color Ball Sort user stories', () => {
	it('lets a player start a two-minute sprint immediately', () => {
		startSprint({ useClock: true });

		cy.get(selectors.timer).should('contain.text', '02:00');
		cy.get(selectors.completedLevels).should('contain.text', '0');
		cy.get(selectors.score).should('contain.text', '0');
		cy.get(selectors.moves).should('contain.text', '0');
	});

	it('generates a small level with five colors, six jars, and one empty helper jar', () => {
		startSprint();

		cy.get('[data-testid^="jar-"]').should('have.length', 6);
		cy.get('[data-testid^="jar-"][data-empty="true"]').should('have.length', 1);
		cy.get(selectors.ball).then((balls) => {
			const colors = new Set([...balls].map((ball) => ball.getAttribute('data-color')));

			expect(colors.size).to.equal(5);
			expect(balls.length).to.be.lessThan(21);
		});
	});

	it('moves the top ball to any jar with free space', () => {
		startSprint();

		cy.get(selectors.jar(0)).find(selectors.ball).last().as('topBall');
		cy.get('@topBall').invoke('attr', 'data-color').as('movedColor');

		cy.get(selectors.jar(0)).click();
		cy.get(selectors.jar(5)).click();

		cy.get<string>('@movedColor').then((movedColor) => {
			cy.get(selectors.jar(5)).find(selectors.ball).last().should('have.attr', 'data-color', movedColor);
		});
		cy.get(selectors.moves).should('contain.text', '1');
	});

	it('keeps the global timer running when a completed level advances instantly', () => {
		startSprint({ useClock: true });

		cy.tick(12_000);
		cy.get(selectors.timer).should('contain.text', '01:48');

		cy.get(selectors.jar(0)).click();
		cy.get(selectors.jar(5)).click();
		cy.get(selectors.levelComplete).should('be.visible');
		cy.get(selectors.completedLevels).should('contain.text', '1');
		cy.get(selectors.timer).should('contain.text', '01:48');
		cy.get(selectors.gameBoard).should('have.attr', 'data-level', '2');
	});

	it('shows final results after two minutes', () => {
		startSprint({ useClock: true });

		cy.tick(120_000);

		cy.get(selectors.results).should('be.visible');
		cy.get(selectors.finalLevels).should('be.visible');
		cy.get(selectors.finalScore).should('be.visible');
		cy.get(selectors.finalMoves).should('be.visible');
	});

	it('submits leaderboard data for a completed sprint', () => {
		cy.intercept('POST', '/api/leaderboard', {
			statusCode: 201,
			body: {
				ok: true,
			},
		}).as('submitLeaderboard');

		startSprint({ useClock: true });
		cy.tick(120_000);
		cy.get(selectors.leaderboardName).type('Ada');
		cy.get(selectors.submitScore).click();

		cy.wait('@submitLeaderboard')
			.its('request.body')
			.should((body) => {
				expect(body).to.include.keys(['playerName', 'score', 'completedLevels', 'moves']);
				expect(body.playerName).to.equal('Ada');
			});
	});

	it('is playable on a mobile viewport with touch-sized jars', () => {
		cy.viewport('iphone-6');
		startSprint();

		cy.get(selectors.gameBoard).should('be.visible');
		cy.get(selectors.jar(0)).then(($jar) => {
			const rect = $jar[0].getBoundingClientRect();

			expect(rect.width).to.be.greaterThan(44);
			expect(rect.height).to.be.greaterThan(120);
		});

		cy.get(selectors.jar(0)).click();
		cy.get(selectors.jar(5)).click();
		cy.get(selectors.moves).should('contain.text', '1');
	});

	it('is playable on a desktop viewport with a centered stable layout', () => {
		cy.viewport(1440, 900);
		startSprint();

		cy.get(selectors.gameBoard).then(($board) => {
			const rect = $board[0].getBoundingClientRect();
			const boardCenter = rect.left + rect.width / 2;

			expect(boardCenter).to.be.closeTo(720, 80);
			expect(rect.width).to.be.lessThan(960);
		});
	});

	it('persists sound and motion preferences between sessions', () => {
		cy.visit('/');
		cy.get(selectors.settings).click();
		cy.get(selectors.soundToggle).click();
		cy.get(selectors.motionToggle).click();

		cy.reload();

		cy.get(selectors.settings).click();
		cy.get(selectors.soundToggle).should('have.attr', 'aria-pressed', 'false');
		cy.get(selectors.motionToggle).should('have.attr', 'aria-pressed', 'false');
	});
});
