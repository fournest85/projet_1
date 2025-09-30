class User {
    constructor(name, email, phone, githubId=null, githubUrl=null) {
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.githubId = githubId;
        this.githubUrl = githubUrl;

    }
}

module.exports = { User };