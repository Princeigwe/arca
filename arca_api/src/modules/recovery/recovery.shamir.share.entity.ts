import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn } from "typeorm";


@Entity('recovery_shamir_shares')
export class RecoveryShare{
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  walletAddressHash: string

  @Column()
  encryptedShare: string

  @CreateDateColumn()
  createdAt: Date
}