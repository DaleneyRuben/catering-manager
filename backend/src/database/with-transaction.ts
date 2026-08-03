import { Transaction } from 'sequelize';
import sequelize from './sequelize';

// ADR-007 rule 3: every domain write takes an optional transaction as its last parameter, so a
// workflow that crosses domains commits or fails as one. This is the other half of that rule —
// a write joins the caller's transaction when there is one and opens its own when there is not,
// so the same function is safe called alone or as one step of a larger workflow.
export const withTransaction = <T>(
  transaction: Transaction | undefined,
  work: (t: Transaction) => Promise<T>,
): Promise<T> => (transaction ? work(transaction) : sequelize.transaction(work));
