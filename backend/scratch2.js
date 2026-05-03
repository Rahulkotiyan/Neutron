const db = require('./config/db');
const { NotesLibrary } = require('./models/Schema');
const mongoose = require('mongoose');

db().then(async () => {
    try {
        const notes = await NotesLibrary.find().lean();
        console.log('Total notes:', notes.length);
        const driveNotes = notes.filter(n => n.subject === 'Drive Sync');
        console.log('Drive notes:', driveNotes.length);
        if(driveNotes.length > 0) {
            console.log(JSON.stringify(driveNotes[0], null, 2));
        }
    } catch(err) {
        console.error(err);
    }
    mongoose.disconnect();
    process.exit(0);
});
