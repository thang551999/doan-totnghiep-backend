import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { ArticleEntity } from './article.entity';

@Entity('typer-articles')
export class ArticleTypeEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  image: string;

  @Column({ default: 1 })
  isActive: number;

  @OneToMany(() => ArticleEntity, (articleEntity) => articleEntity.typeArticle)
  article: ArticleEntity[];
}
