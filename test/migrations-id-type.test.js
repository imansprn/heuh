const fs = require('fs');
const path = require('path');
const createWebhookSourceMigration = require('../migrations/20260427034928-create-webhook-sources');
const createDestinationMigration = require('../migrations/20260427074603-create-destinations');
const addDestinationIdMigration = require('../migrations/20260427080011-add-destination-id-to-webhook-sources');
const createAdminKeysMigration = require('../migrations/20260519082111-create-admin-keys');
const createWebhookMappingsMigration = require('../migrations/20260519082115-create-webhook-mappings');

describe('Migrations ID type', () => {
    it('uses UUID primary key for WebhookSources table', async () => {
        const createTable = jest.fn();
        await createWebhookSourceMigration.up({ createTable }, { UUID: 'UUID', UUIDV4: 'UUIDV4' });

        const [, schema] = createTable.mock.calls[0];
        expect(schema.id).toMatchObject({
            type: 'UUID',
            primaryKey: true,
            allowNull: false,
            defaultValue: 'UUIDV4',
        });
        expect(schema.id.autoIncrement).toBeUndefined();
    });

    it('uses UUID primary key for Destinations table', async () => {
        const createTable = jest.fn();
        await createDestinationMigration.up({ createTable }, { UUID: 'UUID', UUIDV4: 'UUIDV4' });

        const [, schema] = createTable.mock.calls[0];
        expect(schema.id).toMatchObject({
            type: 'UUID',
            primaryKey: true,
            allowNull: false,
            defaultValue: 'UUIDV4',
        });
        expect(schema.id.autoIncrement).toBeUndefined();
    });

    it('uses UUID for WebhookSources.destinationId foreign key', async () => {
        const addColumn = jest.fn();
        await addDestinationIdMigration.up({ addColumn }, { UUID: 'UUID' });

        const [tableName, columnName, column] = addColumn.mock.calls[0];
        expect(tableName).toBe('webhook_sources');
        expect(columnName).toBe('destination_id');
        expect(column.type).toBe('UUID');
        expect(column.references.model).toBe('destinations');
    });

    it('uses admin_keys table name for admin keys migration', async () => {
        const createTable = jest.fn();
        const dropTable = jest.fn();
        await createAdminKeysMigration.up({ createTable }, { UUID: 'UUID', UUIDV4: 'UUIDV4' });
        await createAdminKeysMigration.down({ dropTable });

        expect(createTable).toHaveBeenCalledWith('admin_keys', expect.any(Object));
        expect(dropTable).toHaveBeenCalledWith('admin_keys');
    });

    it('uses snake_case names for all tables and columns in create-table migrations', async () => {
        const createTable = jest.fn();
        const sequelize = {
            UUID: 'UUID',
            UUIDV4: 'UUIDV4',
            STRING: 'STRING',
            BOOLEAN: 'BOOLEAN',
            DATE: 'DATE',
            TEXT: 'TEXT',
            JSONB: 'JSONB',
        };

        await createWebhookSourceMigration.up({ createTable }, sequelize);
        await createDestinationMigration.up({ createTable }, sequelize);
        await createAdminKeysMigration.up({ createTable }, sequelize);
        await createWebhookMappingsMigration.up({ createTable }, sequelize);

        const tables = createTable.mock.calls.map(([name]) => name);
        expect(tables).toEqual(['webhook_sources', 'destinations', 'admin_keys', 'webhook_mappings']);

        for (const [, schema] of createTable.mock.calls) {
            for (const columnName of Object.keys(schema)) {
                expect(columnName).toMatch(/^[a-z0-9_]+$/);
            }
        }
    });
});

describe('AdminKey model table name', () => {
    afterEach(() => {
        jest.resetModules();
    });

    it('maps AdminKey model to admin_keys table', () => {
        jest.isolateModules(() => {
            jest.doMock('sequelize', () => ({
                Model: class {
                    static init(attributes, options) {
                        this.attributes = attributes;
                        this.options = options;
                        return this;
                    }
                },
            }));

            const defineAdminKey = require('../models/admin_key');
            const AdminKey = defineAdminKey({}, { UUID: 'UUID', UUIDV4: 'UUIDV4' });

            expect(AdminKey.options.tableName).toBe('admin_keys');
        });
    });

    describe('Schema file naming', () => {
        it('uses snake_case/pluralized filenames for migrations and model files', () => {
            const expectedFiles = [
                'migrations/20260427034928-create-webhook-sources.js',
                'migrations/20260427074603-create-destinations.js',
                'models/admin_key.js',
                'models/webhook_source.js',
                'models/webhook_mapping.js',
            ];

            for (const relativePath of expectedFiles) {
                const absolutePath = path.resolve(__dirname, '..', relativePath);
                expect(fs.existsSync(absolutePath)).toBe(true);
            }
        });
    });
});
