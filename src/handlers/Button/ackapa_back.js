const ackapaCommand = require('../../commands/App/Admin/ackapa.js');

module.exports = {
    customId: 'ackapa_back',
    
    async execute(interaction) {
        // Ackapa komutunun execute metodunu çağırarak ana menüye dön
        await ackapaCommand.execute({ interaction });
    }
};
