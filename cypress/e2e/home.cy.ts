describe('home page', () => {
	it('shows the Color Ball Sort landing surface', () => {
		cy.visit('/');
		cy.contains('h1', 'Color Ball Sort').should('be.visible');
		cy.contains('Next.js + Phaser game sample').should('be.visible');
	});
});
