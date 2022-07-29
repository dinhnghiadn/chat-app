const EntitySchema = require("typeorm").EntitySchema;

module.exports = new EntitySchema({
    name: "User",
    tableName: "users",
    columns: {
        id: {
            primary: true,
            type: "int",
            generated: true,
        },
        username: {
            type: "varchar",
            required: true,
            unique:true
        },
        password: {
            type: "varchar",
            required: true
        },
        role: {
            type: "varchar",
            default: "user"
        },
    },
    relations: {
        sockets: {
            target: "Socket",
            type: "one-to-many",
            cascade: true,
            inverseSide: 'user',
        },
    },
})
