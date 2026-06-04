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
	cy.window().should((win) => {
		expect(win.document.readyState).to.equal('complete');
	});
	cy.wait(500);
	if (useClock) {
		cy.clock();
	}
	cy.get(selectors.startSprint).click();
	cy.get(selectors.gameBoard).should('be.visible');
};

const readBoardSignature = () =>
	cy
		.get('[data-testid^="jar-"]')
		.then((jars) =>
			[...jars].map((jar) => [...jar.querySelectorAll('[data-testid="ball"]')].map((ball) => ball.getAttribute('data-color')).join(',')).join('|')
		);

const findAvailableMove = () =>
	cy.get('[data-testid^="jar-"]').then((jars) => {
		const jarElements = [...jars];
		const sourceJar = jarElements.findIndex((jar) => jar.querySelectorAll('[data-testid="ball"]').length > 0);
		const targetJar = jarElements.findIndex((jar, jarIndex) => jarIndex !== sourceJar && jar.querySelectorAll('[data-testid="ball"]').length < 3);

		expect(sourceJar).to.be.greaterThan(-1);
		expect(targetJar).to.be.greaterThan(-1);

		return { sourceJar, targetJar };
	});

const dragTopBallToJar = (sourceJar: number, targetJar: number) => {
	cy.get(selectors.jar(sourceJar))
		.find(`${selectors.ball}[data-top="true"]`)
		.then(($ball) => {
			const rect = $ball[0].getBoundingClientRect();

			cy.wrap($ball).trigger('pointerdown', {
				pointerId: 1,
				pointerType: 'mouse',
				button: 0,
				buttons: 1,
				clientX: rect.left + rect.width / 2,
				clientY: rect.top + rect.height / 2,
			});
		});
	cy.get('.dragGhost').should('exist');
	cy.get(selectors.jar(targetJar)).then(($jar) => {
		const rect = $jar[0].getBoundingClientRect();
		const clientX = rect.left + rect.width / 2;
		const clientY = rect.top + rect.height / 2;

		cy.wrap($jar).trigger('pointermove', { pointerId: 1, pointerType: 'mouse', button: 0, buttons: 1, clientX, clientY });
		cy.wrap($jar).trigger('pointerup', { pointerId: 1, pointerType: 'mouse', button: 0, buttons: 0, clientX, clientY });
	});
};

const dragTopBallOutsideJar = (sourceJar: number) => {
	cy.get(selectors.jar(sourceJar))
		.find(`${selectors.ball}[data-top="true"]`)
		.then(($ball) => {
			const rect = $ball[0].getBoundingClientRect();

			cy.wrap($ball).trigger('pointerdown', {
				pointerId: 1,
				pointerType: 'mouse',
				button: 0,
				buttons: 1,
				clientX: rect.left + rect.width / 2,
				clientY: rect.top + rect.height / 2,
			});
		});
	cy.get('.dragGhost').should('exist');
	cy.get(selectors.gameBoard).trigger('pointermove', { pointerId: 1, pointerType: 'mouse', button: 0, buttons: 1, clientX: 8, clientY: 8 });
	cy.get(selectors.gameBoard).trigger('pointerup', { pointerId: 1, pointerType: 'mouse', button: 0, buttons: 0, clientX: 8, clientY: 8 });
};

describe('Color Ball Sort user stories', () => {
	it('lets a player start a two-minute sprint immediately', () => {
		startSprint({ useClock: true });

		cy.get(selectors.timer).should('contain.text', '02:00');
		cy.get(selectors.completedLevels).should('contain.text', '0');
		cy.get(selectors.score).should('contain.text', '0');
		cy.get(selectors.moves).should('contain.text', '0');
		cy.get(selectors.gameBoard).find('canvas').should('be.visible');
	});

	it('generates a small level with five colors, six jars, and one empty helper jar', () => {
		startSprint();

		cy.get('[data-testid^="jar-"]').should('have.length', 6);
		cy.get('[data-testid^="jar-"][data-empty="true"]').should('have.length', 1);
		cy.get('[data-testid^="jar-"]').each((jar) => {
			expect(jar.find('[data-testid="ball"]').length).to.be.at.most(3);
		});
		cy.get(selectors.ball).then((balls) => {
			const colors = new Set([...balls].map((ball) => ball.getAttribute('data-color')));

			expect(colors.size).to.equal(5);
			expect(balls.length).to.equal(15);
		});
		readBoardSignature().should((signature) => {
			const jars = signature.split('|');
			const mixedJars = jars.filter((jar) => {
				const jarColors = jar.split(',').filter(Boolean);

				return new Set(jarColors).size > 1;
			});

			expect(mixedJars.length).to.be.greaterThan(0);
		});
	});

	it('moves the top ball to any jar with free space', () => {
		startSprint();

		findAvailableMove().then(({ sourceJar, targetJar }) => {
			cy.get(selectors.jar(sourceJar))
				.find(`${selectors.ball}[data-top="true"]`)
				.then((topBall) => {
					const movedColor = topBall.attr('data-color');

					dragTopBallToJar(sourceJar, targetJar);
					cy.get(selectors.jar(targetJar)).find(selectors.ball).last().should('have.attr', 'data-color', movedColor);
				});
		});
		cy.get(selectors.moves).should('contain.text', '1');
	});

	it('keeps the dragged ball attached to mouse input', () => {
		startSprint();

		findAvailableMove().then(({ sourceJar, targetJar }) => {
			cy.get(selectors.jar(sourceJar))
				.find(`${selectors.ball}[data-top="true"]`)
				.then(($ball) => {
					const rect = $ball[0].getBoundingClientRect();

					cy.wrap($ball).trigger('pointerdown', {
						pointerId: 1,
						pointerType: 'mouse',
						button: 0,
						buttons: 1,
						clientX: rect.left + rect.width / 2,
						clientY: rect.top + rect.height / 2,
					});
				});
			cy.get(selectors.jar(targetJar)).then(($jar) => {
				const rect = $jar[0].getBoundingClientRect();
				const clientX = rect.left + rect.width / 2;
				const clientY = rect.top + rect.height / 2;

				cy.wrap($jar).trigger('pointermove', { pointerId: 1, pointerType: 'mouse', button: 0, buttons: 1, clientX, clientY });
				cy.get('.dragGhost')
					.should('exist')
					.and(($ghost) => {
						const ghostRect = $ghost[0].getBoundingClientRect();

						expect(ghostRect.left + ghostRect.width / 2).to.be.closeTo(clientX, 2);
						expect(ghostRect.top + ghostRect.height / 2).to.be.closeTo(clientY, 2);
					});
				cy.wrap($jar).trigger('pointerup', { pointerId: 1, pointerType: 'mouse', button: 0, buttons: 0, clientX, clientY });
			});
		});
		cy.get(selectors.moves).should('contain.text', '1');
	});

	it('reverts a dragged ball when it is dropped outside a jar', () => {
		startSprint();

		readBoardSignature().as('initialSignature');
		findAvailableMove().then(({ sourceJar }) => {
			dragTopBallOutsideJar(sourceJar);
		});

		cy.get<string>('@initialSignature').then((initialSignature) => {
			readBoardSignature().should((nextSignature) => {
				expect(nextSignature).to.equal(initialSignature);
			});
		});
		cy.get(selectors.moves).should('contain.text', '0');
	});

	it('keeps the global timer running while moves are made', () => {
		startSprint({ useClock: true });

		cy.tick(12_000);
		cy.get(selectors.timer).should('contain.text', '01:48');

		readBoardSignature().then((initialSignature) => {
			findAvailableMove().then(({ sourceJar, targetJar }) => {
				dragTopBallToJar(sourceJar, targetJar);
			});
			cy.get(selectors.completedLevels).should('contain.text', '0');
			cy.get(selectors.timer).should('contain.text', '01:48');
			readBoardSignature().should((nextSignature) => {
				expect(nextSignature).not.to.equal(initialSignature);
			});
		});
	});

	it('allows repeated dragging on a randomized board', () => {
		startSprint();

		findAvailableMove().then(({ sourceJar, targetJar }) => {
			dragTopBallToJar(sourceJar, targetJar);
		});

		findAvailableMove().then(({ sourceJar, targetJar }) => {
			cy.get(selectors.jar(sourceJar))
				.find(`${selectors.ball}[data-top="true"]`)
				.then((topBall) => {
					const movedColor = topBall.attr('data-color');

					dragTopBallToJar(sourceJar, targetJar);
					cy.get(selectors.jar(targetJar)).find(selectors.ball).last().should('have.attr', 'data-color', movedColor);
				});
		});
		cy.get(selectors.moves).should('contain.text', '2');
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

		findAvailableMove().then(({ sourceJar, targetJar }) => {
			dragTopBallToJar(sourceJar, targetJar);
		});
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
