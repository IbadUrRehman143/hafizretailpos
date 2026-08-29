#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/32dc01ad5a111b054a5e159577bfbba8ceeab3c80c8502d541160313150a7524/contract';
import endContract from '../../snapshots/32dc01ad5a111b054a5e159577bfbba8ceeab3c80c8502d541160313150a7524/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/f1e0968ba86d56002be254c37f17b8938d154afb4fef53cdc2c79b4a69a62390/contract';
import startContract from '../../snapshots/f1e0968ba86d56002be254c37f17b8938d154afb4fef53cdc2c79b4a69a62390/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'invoice',
        column: col('discount', 'float8', {
          notNull: true,
          default: lit(0),
          codecRef: { codecId: 'pg/float8@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'invoice',
        column: col('notes', 'text', {
          notNull: true,
          default: lit(''),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'invoice',
        column: col('paymentMethod', 'text', {
          notNull: true,
          default: lit('Cash'),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'invoice',
        column: col('saleType', 'text', {
          notNull: true,
          default: lit('RETAIL'),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'invoiceItem',
        column: col('discount', 'float8', {
          notNull: true,
          default: lit(0),
          codecRef: { codecId: 'pg/float8@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'invoiceItem',
        column: col('grossAmount', 'float8', {
          notNull: true,
          default: lit(0),
          codecRef: { codecId: 'pg/float8@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'purchase',
        column: col('paymentMethod', 'text', {
          notNull: true,
          default: lit('Cash'),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
      this.setDefault({
        schema: 'public',
        table: 'product',
        column: 'purchasePrice',
        defaultSql: 'DEFAULT 0',
      }),
      this.setDefault({
        schema: 'public',
        table: 'product',
        column: 'sellingPrice',
        defaultSql: 'DEFAULT 0',
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
