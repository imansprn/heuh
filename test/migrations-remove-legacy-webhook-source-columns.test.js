const migration = require('../migrations/20260520112119-remove-legacy-webhook-source-columns');

describe('remove legacy webhook source columns migration', () => {
    let queryInterface;
    let Sequelize;

    beforeEach(() => {
        queryInterface = {
            describeTable: jest.fn(),
            removeColumn: jest.fn(),
            addColumn: jest.fn(),
            sequelize: { query: jest.fn() },
        };

        Sequelize = {
            STRING: 'STRING',
            BOOLEAN: 'BOOLEAN',
        };
    });

    it('drops secret and is_active when present', async () => {
        queryInterface.describeTable.mockResolvedValue({
            secret: { type: 'VARCHAR' },
            is_active: { type: 'BOOLEAN' },
        });

        await migration.up(queryInterface);

        expect(queryInterface.describeTable).toHaveBeenCalledWith('webhook_sources');
        expect(queryInterface.removeColumn).toHaveBeenCalledWith('webhook_sources', 'secret');
        expect(queryInterface.removeColumn).toHaveBeenCalledWith('webhook_sources', 'is_active');
    });

    it('recreates removed columns in down migration', async () => {
        queryInterface.describeTable.mockResolvedValue({});

        await migration.down(queryInterface, Sequelize);

        expect(queryInterface.addColumn).toHaveBeenCalledWith(
            'webhook_sources',
            'secret',
            expect.objectContaining({ type: Sequelize.STRING, allowNull: true })
        );
        expect(queryInterface.addColumn).toHaveBeenCalledWith(
            'webhook_sources',
            'is_active',
            expect.objectContaining({ type: Sequelize.BOOLEAN, allowNull: true })
        );
    });
});
