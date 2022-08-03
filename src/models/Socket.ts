import {
    BaseEntity,
    Column,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn
} from "typeorm"
import {User} from "./User";

@Entity('sockets')
export class Socket extends BaseEntity{

    @PrimaryGeneratedColumn()
    id: number

    @Column({unique:true})
    socketID: string

    @Column()
    roomName: string

    @ManyToOne(()=>User,(user) => user.sockets)
    user: User
}
