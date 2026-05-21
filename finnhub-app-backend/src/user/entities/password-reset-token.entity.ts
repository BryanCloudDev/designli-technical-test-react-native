import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from './user.entity';

/**
 * Represents a one-time password-reset token stored in the database.
 *
 * Only the SHA-256 hash of the raw token is persisted so that a database
 * breach does not expose usable tokens. Each token belongs to a single
 * {@link User} and is invalidated either on use or expiry (1 hour from
 * creation).
 *
 * The corresponding `User` entity intentionally has no `@OneToMany` back-
 * reference to this entity in order to keep the user aggregate clean.
 */
@Entity()
export class PasswordResetToken {
  /**
   * Universally unique identifier for this token record, auto-generated as
   * a UUID v4.
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * SHA-256 hex digest of the raw reset token sent to the user.
   *
   * Storing only the hash means the plaintext token is never at rest in the
   * database. Uniqueness is enforced at the database level.
   */
  @Column({ unique: true })
  tokenHash: string;

  /**
   * The user who requested the password reset.
   *
   * Deleting the parent {@link User} row cascades and removes all associated
   * token records automatically.
   */
  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: false })
  user: User;

  /**
   * Foreign-key column that mirrors the `user` relation.
   *
   * Stored as a plain column so that queries can filter by user ID without
   * joining the `user` table.
   */
  @Column()
  userId: string;

  /**
   * The UTC timestamp after which this token is no longer valid.
   *
   * Tokens are created with a 1-hour validity window.
   */
  @Column()
  expiresAt: Date;

  /**
   * Whether this token has already been consumed.
   *
   * Set to `true` immediately after a successful password reset to prevent
   * replay attacks.
   */
  @Column({ default: false })
  used: boolean;

  /**
   * Timestamp recording when this token record was first persisted.
   */
  @CreateDateColumn()
  createdAt: Date;
}
