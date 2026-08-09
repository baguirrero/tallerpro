import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Trabajo } from '../../trabajos/entities/trabajo.entity';
import { numerico } from '../../common/transformers/numerico';

@Entity('repuestos')
export class Repuesto {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 200 })
  descripcion!: string;

  @Column({ type: 'int' })
  cantidad!: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, transformer: numerico })
  precio_unitario!: number;

  @ManyToOne(() => Trabajo, (trabajo) => trabajo.repuestos, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'trabajo_id' })
  trabajo!: Trabajo;

  @CreateDateColumn()
  created_at!: Date;
}
