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

@Entity('comentarios')
export class Comentario {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  contenido!: string;

  @ManyToOne(() => Trabajo, (trabajo) => trabajo.comentarios, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trabajo_id' })
  trabajo!: Trabajo;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_id' })
  usuario!: Usuario;

  @CreateDateColumn()
  created_at!: Date;
}
