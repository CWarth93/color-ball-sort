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
		cy.contains('Louisenstrasse 54').should('be.visible');
		cy.contains('01099 Dresden').should('be.visible');
		cy.contains('christopher.warth@web.de').should('have.attr', 'href', 'mailto:christopher.warth@web.de');
		cy.contains('Impressum Generator von JuraForum.de').should('have.attr', 'href', 'https://www.juraforum.de/impressum-generator/');
		cy.contains('a', 'Imprint').should('not.exist');
		cy.contains('a', 'Back to game').should('have.attr', 'href', '/');
	});

	it('keeps the selected theme on the imprint page', () => {
		cy.visit('/');
		cy.get('[data-testid="theme-barbie"]').click();
		cy.get('html').should('have.attr', 'data-theme', 'barbie');
		cy.contains('a', 'Imprint').click();
		cy.location('pathname').should('equal', '/imprint');
		cy.get('html').should('have.attr', 'data-theme', 'barbie');
		cy.contains('h1', 'Impressum').should('be.visible');
		cy.contains('a', 'Imprint').should('not.exist');
	});
});
