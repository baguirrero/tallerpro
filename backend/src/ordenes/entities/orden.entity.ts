import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Trabajo } from '../../trabajos/entities/trabajo.entity';
import { EstadoOrden } from '../../common/enums/estados.enum';

@Entity('ordenes')
export class Orden {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  numero_orden!: string;

  @Column({ type: 'text' })
  descripcion!: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  presupuesto?: number;

  @Column({ type: 'date' })
  fecha_ingreso!: Date;

  @Column({ type: 'date', nullable: true })
  fecha_entrega?: Date;

  @Column({ type: 'varchar', length: 20, default: EstadoOrden.RECIBIDA })
  estado!: string;

  @Column({ type: 'varchar', length: 10 })
  placa!: string;

  @Column({ type: 'varchar', length: 50 })
  marca!: string;

  @Column({ type: 'varchar', length: 50 })
  modelo!: string;

  @Column({ type: 'int', nullable: true })
  anio?: number;

  @Column({ type: 'varchar', length: 150 })
  cliente_nombre!: string;

  @Column({ type: 'varchar', length: 20 })
  cliente_telefono!: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'creado_por' })
  creado_por!: Usuario;

  @OneToMany(() => Trabajo, (trabajo) => trabajo.orden)
  trabajos!: Trabajo[];

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
