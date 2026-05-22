import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from './user.entity';

@Entity()
export class PasswordResetToken {

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


  @Column()
  expiresAt: Date;


  @Column({ default: false })
  used: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
