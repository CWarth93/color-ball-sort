describe('home page', () => {
	it('shows the Color Ball Sort game immediately', () => {
		cy.visit('/');
		cy.get('[data-testid="game-board"]').should('be.visible');
		cy.contains('a', 'Imprint').should('be.visible');
	});
});
