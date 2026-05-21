import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Represents a registered user in the system.
 *
 * Maps to the `user` table in the database. The `password` column is excluded
 * from query results by default (`select: false`) and must be explicitly
 * selected when needed.
 */
@Entity()
export class User {
  /**
   * Universally unique identifier for the user, auto-generated as a UUID v4.
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * The user's email address. Must be unique across all accounts and is
   * stored exactly as provided (normalisation is enforced at the DTO layer).
   */
  @Column({ unique: true, nullable: false })
  email: string;

  /**
   * The user's hashed password. Excluded from query results by default to
   * prevent accidental exposure in API responses.
   */
  @Column({ nullable: false, select: false })
  password: string;

  /**
   * The user's given (first) name.
   */
  @Column({ nullable: false })
  name: string;

  /**
   * The user's family (last) name.
   */
  @Column({ nullable: false })
  lastName: string;

  /**
   * Firebase Cloud Messaging device token used to send push notifications.
   * Registered by the React Native client after obtaining permission.
   * Nullable — users without a token simply will not receive push alerts.
   */
  @Column({ nullable: true, length: 255 })
  fcmToken?: string;

  /**
   * Timestamp recording when the user record was first persisted.
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * Timestamp updated automatically whenever the user record is modified.
   */
  @UpdateDateColumn()
  updatedAt: Date;
}
