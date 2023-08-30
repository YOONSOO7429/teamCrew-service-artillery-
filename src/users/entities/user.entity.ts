import { Crew } from 'src/crew/entities/crew.entity';
import { Notice } from 'src/notice/entities/notice.entity';
import { Signup } from 'src/signup/entities/signup.entity';
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

@Entity('users')
export class Users {
  @PrimaryGeneratedColumn()
  userId: number;

  @Column()
  provider: string;

  @Column()
  email: string;

  @Column()
  nickname: string;

  @Column({ nullable: true })
  profileImage: string;

  @Column({ nullable: true })
  age: number;

  @Column({ nullable: true })
  gender: string;

  @Column({ nullable: true })
  myMessage: string;

  @Column({ nullable: true })
  location: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @OneToMany(() => Crew, (crew) => crew.userId)
  crew: Crew[];

  @OneToMany(() => Signup, (signup) => signup.userId)
  signup: Signup[];

  @OneToMany(() => Notice, (notice) => notice.userId)
  notice: Notice[];
}
