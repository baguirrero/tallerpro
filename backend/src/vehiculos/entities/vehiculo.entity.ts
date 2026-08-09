import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Orden } from '../../ordenes/entities/orden.entity';

@Entity('vehiculos')
export class Vehiculo {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Siempre normalizada: mayúsculas y solo letras y dígitos. */
  @Column({ type: 'varchar', length: 10, unique: true })
  placa!: string;

  @Column({ type: 'varchar', length: 50 })
  marca!: string;

  @Column({ type: 'varchar', length: 50 })
  modelo!: string;

  @Column({ type: 'int', nullable: true })
  anio?: number;

  @Column({ type: 'varchar', length: 150 })
  propietario_nombre!: string;

  @Column({ type: 'varchar', length: 20 })
  propietario_telefono!: string;

  @OneToMany(() => Orden, (orden) => orden.vehiculo)
  ordenes!: Orden[];

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
