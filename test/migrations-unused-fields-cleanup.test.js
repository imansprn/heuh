const migration = require('../migrations/20260519130000-remove-unused-webhook-fields');

describe('remove unused webhook fields migration', () => {
    let queryInterface;
    let Sequelize;

    beforeEach(() => {
        queryInterface = {
            describeTable: jest.fn(),
            removeColumn: jest.fn(),
            addColumn: jest.fn(),
        };

        Sequelize = {
            UUID: 'UUID',
            STRING: 'STRING',
            JSONB: 'JSONB',
        };
    });

    it('drops destination_id, path, and transform_config when present', async () => {
        queryInterface.describeTable.mockResolvedValueOnce({
            destination_id: { type: 'UUID' },
            path: { type: 'VARCHAR' },
        });
        queryInterface.describeTable.mockResolvedValueOnce({
            transform_config: { type: 'JSONB' },
        });

        await migration.up(queryInterface);

        expect(queryInterface.describeTable).toHaveBeenCalledWith('webhook_sources');
        expect(queryInterface.describeTable).toHaveBeenCalledWith('webhook_mappings');
        expect(queryInterface.removeColumn).toHaveBeenCalledWith('webhook_sources', 'destination_id');
        expect(queryInterface.removeColumn).toHaveBeenCalledWith('webhook_sources', 'path');
        expect(queryInterface.removeColumn).toHaveBeenCalledWith('webhook_mappings', 'transform_config');
    });

    it('recreates removed columns in down migration', async () => {
        queryInterface.describeTable.mockResolvedValueOnce({});
        queryInterface.describeTable.mockResolvedValueOnce({});

        await migration.down(queryInterface, Sequelize);

        expect(queryInterface.addColumn).toHaveBeenCalledWith(
            'webhook_sources',
            'destination_id',
            expect.objectContaining({ type: Sequelize.UUID, allowNull: true })
        );
        expect(queryInterface.addColumn).toHaveBeenCalledWith(
            'webhook_sources',
            'path',
            expect.objectContaining({ type: Sequelize.STRING, allowNull: true })
        );
        expect(queryInterface.addColumn).toHaveBeenCalledWith(
            'webhook_mappings',
            'transform_config',
            expect.objectContaining({ type: Sequelize.JSONB })
        );
    });
});
