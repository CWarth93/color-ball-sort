describe('home page', () => {
	it('shows the Color Ball Sort game immediately', () => {
		cy.visit('/');
		cy.contains('h1', 'Color Ball Sort').should('be.visible');
		cy.get('[data-testid="game-board"]').should('be.visible');
	});
});
