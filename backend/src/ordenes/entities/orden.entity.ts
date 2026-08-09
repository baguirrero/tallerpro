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
import { Vehiculo } from '../../vehiculos/entities/vehiculo.entity';
import { EstadoOrden } from '../../common/enums/estados.enum';

@Entity('ordenes')
export class Orden {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  numero_orden!: string;

  @Column({ type: 'text' })
  descripcion!: string;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: {
      to: (valor?: number) => valor,
      from: (valor?: string) => (valor == null ? valor : Number(valor)),
    },
  })
  presupuesto?: number;

  @Column({ type: 'date' })
  fecha_ingreso!: string;

  @Column({ type: 'date', nullable: true })
  fecha_entrega?: string;

  @Column({ type: 'varchar', length: 20, default: EstadoOrden.RECIBIDA })
  estado!: string;

  // RESTRICT y no CASCADE a propósito: borrar un vehículo con historial debe
  // fallar, no llevarse sus órdenes por delante.
  @ManyToOne(() => Vehiculo, (vehiculo) => vehiculo.ordenes, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'vehiculo_id' })
  vehiculo!: Vehiculo;

  @ManyToOne(() => Usuario, { nullable: false })
  @JoinColumn({ name: 'creado_por' })
  creado_por!: Usuario;

  @OneToMany(() => Trabajo, (trabajo) => trabajo.orden)
  trabajos!: Trabajo[];

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
