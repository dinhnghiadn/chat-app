const EntitySchema = require("typeorm").EntitySchema;

module.exports = new EntitySchema({
    name: "Socket",
    tableName: "sockets",
    columns: {
        id: {
            primary: true,
            type: "int",
            generated: true,
        },
        socketID: {
            type: "varchar",
            required: true,
            unique: true
        },
        roomName: {
            type: "varchar",
            required: true
        },
    },
    relations: {
        user: {
            target: "User",
            type: "many-to-one",
            // cascade: true,
            required:true,
            joinColumn: true,
        },
    },
})
