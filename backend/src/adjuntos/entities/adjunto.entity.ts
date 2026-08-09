import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Trabajo } from '../../trabajos/entities/trabajo.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';

@Entity('adjuntos')
export class Adjunto {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  nombre_original!: string;

  @Column({ type: 'varchar', length: 255 })
  nombre_archivo!: string;

  @Column({ type: 'varchar', length: 500 })
  ruta!: string;

  @Column({ type: 'varchar', length: 100 })
  tipo_mime!: string;

  @Column({ type: 'int' })
  tamano!: number;

  @ManyToOne(() => Trabajo, (trabajo) => trabajo.adjuntos, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'trabajo_id' })
  trabajo!: Trabajo;

  @ManyToOne(() => Usuario, { nullable: false })
  @JoinColumn({ name: 'subido_por' })
  subido_por!: Usuario;

  @CreateDateColumn()
  created_at!: Date;
}
