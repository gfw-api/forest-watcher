class AreaNotValid extends Error {

    constructor(messages) {
        super(messages);
        this.name = 'DatasetNotValid';
        this.message = AreaNotValid.getMessages(messages);
        this.status = 400;
    }

    static getMessages(messageList) {
        let messages = '- ';
        messageList.forEach((message) => {
            if (typeof message === 'object' && message !== null) {
                messages += `${Object.keys(message)[0]}: ${message[Object.keys(message)[0]]} - `;
            } else {
                messages += `${message} - `;
            }
        });
        return messages;
    }

}

module.exports = AreaNotValid;
