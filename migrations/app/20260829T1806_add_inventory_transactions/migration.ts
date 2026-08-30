#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/6c070d01516eba91218833393381629ff1d0f3b3a96c8baa7b276295853b91d8/contract';
import startContract from '../../snapshots/6c070d01516eba91218833393381629ff1d0f3b3a96c8baa7b276295853b91d8/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/f6df36b528ae8a3eb3670a36f579bcbf5b4cb987f03b2f80f626af441c8f17ff/contract';
import endContract from '../../snapshots/f6df36b528ae8a3eb3670a36f579bcbf5b4cb987f03b2f80f626af441c8f17ff/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, lit, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'inventoryTransaction',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('note', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('productId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('quantity', 'float8', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/float8@1' },
          }),
          col('referenceId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('referenceType', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('type', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('unit', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createIndex({
        schema: 'public',
        table: 'inventoryTransaction',
        index: 'inventoryTransaction_productId_idx_5858600a',
        columns: ['productId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'inventoryTransaction',
        foreignKey: {
          name: 'inventoryTransaction_productId_fkey',
          columns: ['productId'],
          references: { schema: 'public', table: 'product', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
