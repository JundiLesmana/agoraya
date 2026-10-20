// Agoraya — lib/db types

export type Row = Record<string, unknown>;

export interface Database {
  query<T extends Row = Row>(text: string, params?: readonly unknown[]): Promise<T[]>;
  queryOne<T extends Row = Row>(text: string, params?: readonly unknown[]): Promise<T | null>;
  transaction<T>(fn: (tx: Database) => Promise<T>): Promise<T>;
  end(): Promise<void>;
}
