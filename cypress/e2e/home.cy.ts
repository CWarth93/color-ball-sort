describe('home page', () => {
	it('shows the Color Ball Sort game immediately', () => {
		cy.visit('/');
		cy.contains('h1', 'Color Ball Sort').should('be.visible');
		cy.get('[data-testid="game-board"]').should('be.visible');
		cy.contains('a', 'Imprint').should('be.visible');
	});

	it('shows the copied imprint content', () => {
		cy.visit('/imprint');
		cy.contains('h1', 'Impressum').should('be.visible');
		cy.contains('Christopher Warth').should('be.visible');
		cy.contains('Ziegelstra').should('be.visible');
		cy.contains('christopher.warth@web.de').should('have.attr', 'href', 'mailto:christopher.warth@web.de');
		cy.contains('Impressum Generator von JuraForum.de').should('have.attr', 'href', 'https://www.juraforum.de/impressum-generator/');
		cy.contains('a', 'Back to game').should('have.attr', 'href', '/');
	});
});
