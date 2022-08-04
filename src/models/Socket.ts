import {
    BaseEntity,
    Column,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn
} from "typeorm"
import {User} from "./User"
import {MaxLength} from "class-validator"

@Entity('sockets')
export class Socket extends BaseEntity{

    @PrimaryGeneratedColumn()
    id: number

    @Column({unique:true})
    socketID: string

    @MaxLength(12,{message: 'Room name too long, max length is $constraint1!'})
    @Column()
    roomName: string

    @ManyToOne(()=>User,(user) => user.sockets)
    user: User
}
