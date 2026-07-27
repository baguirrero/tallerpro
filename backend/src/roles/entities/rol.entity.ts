import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';

@Entity('roles')
export class Rol {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  nombre!: string;

  @Column({ type: 'varchar', length: 250, nullable: true })
  descripcion?: string;

  @ManyToMany(() => Usuario, (usuario) => usuario.roles)
  @JoinTable({
    name: 'usuario_roles',
    joinColumn: { name: 'rol_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'usuario_id', referencedColumnName: 'id' },
  })
  usuarios!: Usuario[];
}
