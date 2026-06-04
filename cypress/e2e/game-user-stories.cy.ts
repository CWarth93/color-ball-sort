const selectors = {
	gameBoard: '[data-testid="game-board"]',
	jar: (index: number) => `[data-testid="jar-${index}"]`,
	ball: '[data-testid="ball"]',
	levelComplete: '[data-testid="level-complete"]',
	movesUsed: '[data-testid="moves-used"]',
	movesMax: '[data-testid="moves-max"]',
	movesLoading: '[data-testid="moves-loading"]',
	undoTurn: '[data-testid="undo-turn"]',
	levelLoading: '[data-testid="level-loading"]',
	vaporwaveTheme: '[data-testid="theme-vaporwave"]',
	cyberpunkTheme: '[data-testid="theme-cyberpunk"]',
};

const startGame = () => {
	cy.visit('/');
	cy.window().should((win) => {
		expect(win.document.readyState).to.equal('complete');
	});
	cy.get(selectors.gameBoard).should('be.visible').and('have.attr', 'data-ready', 'true');
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

const spendMoves = (moveCount: number): void => {
	if (moveCount <= 0) {
		return;
	}

	findAvailableMove().then(({ sourceJar, targetJar }) => {
		dragTopBallToJar(sourceJar, targetJar);
		spendMoves(moveCount - 1);
	});
};

describe('Color Ball Sort endless game', () => {
	it('shows loading until the stored level and move count are ready', () => {
		cy.intercept('GET', '/api/levels/random', {
			delay: 700,
			body: {
				level: {
					key: 'test-loading-level',
					difficulty: 'easy',
					minimumTurns: 8,
					fastPathCount: 8,
					jars: [
						['#ff5a6f', '#ffd166', '#49c6e5'],
						['#ffd166', '#49c6e5', '#65d46e'],
						['#49c6e5', '#65d46e', '#a78bfa'],
						['#65d46e', '#a78bfa', '#ff5a6f'],
						['#a78bfa', '#ff5a6f', '#ffd166'],
						[],
					],
					jarCapacity: 3,
					ballsPerColor: 3,
					colors: ['#ff5a6f', '#ffd166', '#49c6e5', '#65d46e', '#a78bfa'],
				},
			},
		}).as('loadLevel');

		cy.visit('/');
		cy.get(selectors.gameBoard).should('be.visible').and('have.attr', 'data-ready', 'false');
		cy.get(selectors.levelLoading).should('be.visible').and('contain.text', 'Loading level');
		cy.get(selectors.gameBoard).then(($board) => {
			const boardRect = $board[0].getBoundingClientRect();

			cy.get(selectors.levelLoading).then(($loading) => {
				const loadingRect = $loading[0].getBoundingClientRect();
				const loadingCenterY = loadingRect.top + loadingRect.height / 2;

				expect(loadingCenterY).to.be.closeTo(boardRect.top + boardRect.height / 2, 12);
			});
		});
		cy.get(selectors.movesLoading).should('contain.text', 'Loading');
		cy.get(selectors.movesUsed).should('not.exist');
		cy.get(selectors.movesMax).should('not.exist');
		cy.get(selectors.ball).should('not.exist');

		cy.wait('@loadLevel');
		cy.get(selectors.gameBoard).should('have.attr', 'data-ready', 'true');
		cy.get(selectors.levelLoading).should('not.exist');
		cy.get(selectors.movesUsed).should('contain.text', '0');
		cy.get(selectors.movesMax).should('contain.text', '8');
		cy.get(selectors.ball).should('have.length', 15);
	});

	it('starts directly on the endless game board', () => {
		startGame();

		cy.contains('Endless puzzle').should('not.exist');
		cy.contains('h1', 'Color Ball Sort').should('be.visible');
		cy.contains('Level 1').should('not.exist');
		cy.get('[data-testid="settings"]').should('not.exist');
		cy.get('[data-testid="start-sprint"]').should('not.exist');
		cy.get('[data-testid="timer"]').should('not.exist');
		cy.get('[data-testid="score"]').should('not.exist');
		cy.contains('a', 'Imprint').should('be.visible');
		cy.get(selectors.movesUsed).should('contain.text', '0');
		cy.get(selectors.movesMax).invoke('text').then(Number).should('be.greaterThan', 0);
		cy.get(selectors.movesMax).parent().should('not.contain.text', 'Moves');
		cy.get(selectors.undoTurn).should('be.disabled');
		cy.get(selectors.gameBoard).find('canvas').should('be.visible');
	});

	it('uses the vaporwave theme by default', () => {
		startGame();

		cy.contains('Pick your theme').should('be.visible');
		cy.get(selectors.vaporwaveTheme).should('be.visible').and('have.attr', 'aria-pressed', 'true');
		cy.get(selectors.vaporwaveTheme).find('img').should('have.attr', 'src').and('include', '/themes/vaporwave/theme-icon.png');
		cy.get(selectors.cyberpunkTheme).should('be.visible').and('have.attr', 'aria-pressed', 'false');
	});

	it('switches to the cyberpunk theme', () => {
		startGame();

		cy.get(selectors.cyberpunkTheme).click();
		cy.get(selectors.cyberpunkTheme).should('have.attr', 'aria-pressed', 'true');
		cy.get(selectors.vaporwaveTheme).should('have.attr', 'aria-pressed', 'false');
		cy.get(selectors.cyberpunkTheme).find('img').should('have.attr', 'src').and('include', '/themes/cyberpunk/theme-icon.png');

		findAvailableMove().then(({ sourceJar }) => {
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
		});
		cy.get('.dragGhost').find('img').should('have.attr', 'src').and('include', '/themes/cyberpunk/');
	});

	it('generates a randomized level with five colors, six jars, and three free slots', () => {
		startGame();

		cy.get('[data-testid^="jar-"]').should('have.length', 6);
		cy.get('[data-testid^="jar-"]').then((jars) => {
			const jarBallCounts = [...jars].map((jar) => jar.querySelectorAll('[data-testid="ball"]').length);

			expect(jarBallCounts.every((ballCount) => ballCount <= 3)).to.equal(true);
			expect(jarBallCounts.reduce((freeSlots, ballCount) => freeSlots + (3 - ballCount), 0)).to.equal(3);
			expect(jarBallCounts.some((ballCount) => ballCount < 3)).to.equal(true);
		});
		cy.get(selectors.ball).then((balls) => {
			const colors = new Set([...balls].map((ball) => ball.getAttribute('data-color')));

			expect(colors.size).to.equal(5);
			expect(balls.length).to.equal(15);
		});
		cy.get(selectors.movesMax).invoke('text').then(Number).should('be.within', 6, 19);
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
		startGame();

		findAvailableMove().then(({ sourceJar, targetJar }) => {
			cy.get(selectors.jar(sourceJar))
				.find(`${selectors.ball}[data-top="true"]`)
				.then((topBall) => {
					const movedColor = topBall.attr('data-color');

					dragTopBallToJar(sourceJar, targetJar);
					cy.get(selectors.jar(targetJar)).find(selectors.ball).last().should('have.attr', 'data-color', movedColor);
					cy.get(selectors.movesUsed).should('contain.text', '1');
					cy.get(selectors.undoTurn).should('not.be.disabled');
				});
		});
	});

	it('undoes turns back to the beginning of the level', () => {
		startGame();
		readBoardSignature().as('initialSignature');

		findAvailableMove().then(({ sourceJar, targetJar }) => {
			dragTopBallToJar(sourceJar, targetJar);
		});
		cy.get(selectors.movesUsed).should('contain.text', '1');
		cy.get(selectors.undoTurn).click();
		cy.get(selectors.movesUsed).should('contain.text', '0');
		cy.get(selectors.undoTurn).should('be.disabled');

		cy.get<string>('@initialSignature').then((initialSignature) => {
			readBoardSignature().should((nextSignature) => {
				expect(nextSignature).to.equal(initialSignature);
			});
		});
	});

	it('blocks further moves and highlights undo when the move budget is reached', () => {
		startGame();

		cy.get(selectors.movesMax)
			.invoke('text')
			.then((moveBudgetText) => {
				const moveBudget = Number(moveBudgetText);

				spendMoves(moveBudget);
				cy.get(selectors.movesUsed).should('contain.text', String(moveBudget));
			});

		cy.get(selectors.gameBoard).should('have.attr', 'data-move-blocked', 'true');
		cy.get(selectors.undoTurn).should('have.attr', 'data-highlighted', 'true').and('not.be.disabled');
		cy.get(selectors.movesMax).parent().should('have.attr', 'data-blocked', 'true');
		cy.contains('Level failed').should('not.exist');
		readBoardSignature().as('blockedSignature');

		findAvailableMove().then(({ sourceJar }) => {
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
		});
		cy.get('.dragGhost').should('not.exist');
		cy.get<string>('@blockedSignature').then((blockedSignature) => {
			readBoardSignature().should((nextSignature) => {
				expect(nextSignature).to.equal(blockedSignature);
			});
		});
		cy.get(selectors.movesMax).then(($movesMax) => {
			cy.get(selectors.movesUsed).should('contain.text', $movesMax.text());
		});

		cy.get(selectors.undoTurn).click();
		cy.get(selectors.gameBoard).should('have.attr', 'data-move-blocked', 'false');
		cy.get(selectors.undoTurn).should('have.attr', 'data-highlighted', 'false');
		cy.get(selectors.movesMax).parent().should('have.attr', 'data-blocked', 'false');
	});

	it('keeps the dragged ball attached to mouse input', () => {
		startGame();

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
				cy.get('.dragGhost').find('img').should('have.attr', 'src').and('include', '/themes/vaporwave/');
				cy.wrap($jar).trigger('pointerup', { pointerId: 1, pointerType: 'mouse', button: 0, buttons: 0, clientX, clientY });
			});
		});
	});

	it('reverts a dragged ball when it is dropped outside a jar', () => {
		startGame();

		readBoardSignature().as('initialSignature');
		findAvailableMove().then(({ sourceJar }) => {
			dragTopBallOutsideJar(sourceJar);
		});

		cy.get<string>('@initialSignature').then((initialSignature) => {
			readBoardSignature().should((nextSignature) => {
				expect(nextSignature).to.equal(initialSignature);
			});
		});
	});

	it('allows repeated dragging on a randomized board', () => {
		startGame();

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
	});

	it('is playable on a mobile viewport with touch-sized jars', () => {
		cy.viewport('iphone-6');
		startGame();

		cy.get(selectors.gameBoard).should('be.visible');
		cy.get(selectors.jar(0)).then(($jar) => {
			const rect = $jar[0].getBoundingClientRect();

			expect(rect.width).to.be.greaterThan(44);
			expect(rect.height).to.be.greaterThan(100);
		});

		findAvailableMove().then(({ sourceJar, targetJar }) => {
			dragTopBallToJar(sourceJar, targetJar);
		});
	});

	it('is playable on a desktop viewport with a centered stable layout', () => {
		cy.viewport(1440, 900);
		startGame();

		cy.get(selectors.gameBoard).then(($board) => {
			const rect = $board[0].getBoundingClientRect();
			const boardCenter = rect.left + rect.width / 2;

			expect(boardCenter).to.be.closeTo(720, 80);
			expect(rect.width).to.be.greaterThan(880);
			expect(rect.width).to.be.lessThan(1020);
		});
	});

	it('keeps the desktop board visually balanced below the title', () => {
		cy.viewport(1440, 900);
		startGame();

		cy.contains('h1', 'Color Ball Sort').then(($title) => {
			const titleRect = $title[0].getBoundingClientRect();

			expect(titleRect.top).to.be.lessThan(40);
		});
		cy.get(selectors.gameBoard).then(($board) => {
			const rect = $board[0].getBoundingClientRect();
			const boardCenterY = rect.top + rect.height / 2;

			expect(rect.width).to.be.greaterThan(880);
			expect(rect.width).to.be.lessThan(1020);
			expect(boardCenterY).to.be.closeTo(450, 80);
		});
	});

	it('positions undo and move counter on the game top corners', () => {
		cy.viewport(1440, 900);
		startGame();

		cy.get(selectors.gameBoard).then(($board) => {
			const boardRect = $board[0].getBoundingClientRect();

			cy.get(selectors.undoTurn).then(($undoButton) => {
				const undoRect = $undoButton[0].getBoundingClientRect();

				expect(undoRect.left).to.be.closeTo(boardRect.left, 4);
				expect(undoRect.top).to.be.lessThan(boardRect.top);
			});
			cy.get(selectors.movesMax)
				.parent()
				.then(($moveHud) => {
					const moveRect = $moveHud[0].getBoundingClientRect();

					expect(moveRect.right).to.be.closeTo(boardRect.right, 4);
					expect(moveRect.top).to.be.lessThan(boardRect.top);
				});
		});
	});
});
