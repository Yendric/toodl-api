import Users from '../models/User';

export async function getUserByEmail(email:string) {
    return Users.findOne({
        where: {
            email,
        },
    });
}

export async function getUserById(id:number) {
    return Users.findOne({
        where: {
            id,
        },
    });
}