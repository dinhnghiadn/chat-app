import {
    AfterLoad,
    BaseEntity, BeforeInsert, BeforeUpdate,
    Column,
    Entity, OneToMany,
    PrimaryGeneratedColumn
} from "typeorm"
import {Socket} from "./Socket"
import {MaxLength, MinLength} from "class-validator"
import bcrypt from "bcryptjs"
import { Exclude, instanceToPlain} from "class-transformer"


@Entity('users')
export class User extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column({unique: true})
    @MinLength(3,{message: 'Username too short, min length is $constraint1!'})
    @MaxLength(10, {message: 'Username too short, min length is $constraint1!'})
    username: string

    @Exclude()
    @Column()
    @MinLength(4,{message: 'Password too short, min length is $constraint1!'})
    @MaxLength(20,{message: 'Password too long, max length is $constraint1!'})
    password: string

    @Exclude()
    tempPassword: string;

    @Column({default: 'user'})
    role: string

    @OneToMany(() => Socket, (socket) => socket.user, {cascade: true})
    sockets: Socket[]

    @AfterLoad()
    loadTempPassword(): void {
        this.tempPassword = this.password;
    }

    @BeforeInsert()
    @BeforeUpdate()
    async hashPassword(): Promise<void> {
        if (this.tempPassword !== this.password) {
            try {
                this.password = await bcrypt.hash(this.password, 8)
            } catch (e) {
                throw new Error('There are some issues in the hash!')
            }
        }
    }

    toJSON() { return instanceToPlain(this); }
}


