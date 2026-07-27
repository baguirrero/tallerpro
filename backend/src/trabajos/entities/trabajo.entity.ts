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
import { Orden } from '../../ordenes/entities/orden.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Comentario } from '../../comentarios/entities/comentario.entity';
import { Adjunto } from '../../adjuntos/entities/adjunto.entity';
import { EstadoTrabajo, Prioridad } from '../../common/enums/estados.enum';

@Entity('trabajos')
export class Trabajo {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 200 })
  titulo!: string;

  @Column({ type: 'text', nullable: true })
  descripcion?: string;

  @Column({ type: 'varchar', length: 10, default: Prioridad.MEDIA })
  prioridad!: string;

  @Column({ type: 'varchar', length: 20, default: EstadoTrabajo.PENDIENTE })
  estado!: string;

  @Column({ type: 'date', nullable: true })
  fecha_limite?: Date;

  @ManyToOne(() => Orden, (orden) => orden.trabajos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orden_id' })
  orden!: Orden;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'asignado_a' })
  asignado_a?: Usuario;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'creado_por' })
  creado_por!: Usuario;

  @OneToMany(() => Comentario, (comentario) => comentario.trabajo)
  comentarios!: Comentario[];

  @OneToMany(() => Adjunto, (adjunto) => adjunto.trabajo)
  adjuntos!: Adjunto[];

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
