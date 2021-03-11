export default class User {
    constructor(params) {
        this.id = params.id;
        this.name = params.name;
        this.avatarSrc = params.avatarSrc;
        this.created = params.created;
    }
}
