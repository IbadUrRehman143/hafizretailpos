#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/3283055c496ac2826bd119dfad7acbec9219cd535b7f1f33313257a17184d31e/contract';
import startContract from '../../snapshots/3283055c496ac2826bd119dfad7acbec9219cd535b7f1f33313257a17184d31e/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/995cd7b135dcc885f20d3a3db46acdd9c6d5e29816b50d650b59043383af1d68/contract';
import endContract from '../../snapshots/995cd7b135dcc885f20d3a3db46acdd9c6d5e29816b50d650b59043383af1d68/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'invoiceItem',
        column: col('costAmount', 'float8', {
          notNull: true,
          default: lit(0),
          codecRef: { codecId: 'pg/float8@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'invoiceItem',
        column: col('profitAmount', 'float8', {
          notNull: true,
          default: lit(0),
          codecRef: { codecId: 'pg/float8@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'invoiceItem',
        column: col('purchasePrice', 'float8', {
          notNull: true,
          default: lit(0),
          codecRef: { codecId: 'pg/float8@1' },
        }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
