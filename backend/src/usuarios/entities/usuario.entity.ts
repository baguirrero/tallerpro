import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Rol } from '../../roles/entities/rol.entity';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  username!: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  email!: string;

  @Column({ type: 'text' })
  password_hash!: string;

  @Column({ type: 'varchar', length: 100 })
  nombres!: string;

  @Column({ type: 'varchar', length: 100 })
  apellidos!: string;

  @Column({ type: 'boolean', default: true })
  activo!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @ManyToMany(() => Rol, (rol) => rol.usuarios)
  roles!: Rol[];
}
