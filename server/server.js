
// Client subscribes to this first. 
Meteor.publish("importantThings", function(){
    return [Groups.find(), Events.find()];
});

// Once importantThings are sync'd then subscribe to the rest
Meteor.publish("things", function(){
    return [Photos.find(), Members.find()];
});

// Encapsulate the meetup api gubbins.
var meetup = {

    api: 'https://api.meetup.com',

    groups: function group(opts, cb){
        this.get(this.api + '/2/groups', opts, cb);
    },

    events: function events(opts, cb){
        this.get(this.api + '/2/events', opts, cb);
    },

    photos: function photos(opts, cb){
        this.get(this.api + '/2/photos', opts, cb);  
    },

    members: function members(opts, cb){
        this.get(this.api + '/2/members', opts, cb);
    },

    get: function get(url, opts, cb){
        if(!opts){ 
            opts = {}; 
        }
        if(typeof opts === 'function'){ 
            cb = opts; 
        }

        opts.sign = true;

        opts.key = Meteor.settings.meetupApiKey,

        opts.group_id = Meteor.settings.public.group.id,

        Meteor.http.get(url, { params: opts }, function(error, response){

            console.log('GOT:', response.statusCode, url);

            if(!response.data.results){ // bad ju ju
                var errorMsg = "Response lacks requisit data";
                console.log(errorMsg, response);
                cb(errorMsg);
            }

            // OK GO!
            cb(error, response);
        });
    }
};

// Find a doc by meetup id, and overwrite with the latest, or create new.
function updateOrInsert(collection, doc, idField){
    var query = {};
    query[idField] = doc[idField];

    var existingDoc = collection.findOne(query);
    if (existingDoc){
        collection.update(existingDoc._id, doc);
    } else{
        collection.insert(doc);
    }
}

// Get data from meetup and insert or update a local collection with the data
function sync(method, opts, collection, idField){
    idField = idField || 'id';

    meetup[method](opts, function(err, resp){
        if(err) return;

        var results = resp.data.results;
        var meta = resp.data.meta;

        results.forEach(function(doc){
            console.log('Upserting ' + method, doc.name ? doc.name : doc[idField] /*, doc */);
            updateOrInsert(collection, doc, idField);
        });

        // Are there more pages of data to get?
        if (meta.next){
            opts.offset = opts.offset || 0;
            opts.offset++;
            console.log('Syncing next page', opts.offset);
            sync(method, opts, collection, idField);
        }
    });
}

// get /groups data from api.meetup.com; add or update the Groups collection.
function syncAllTheThings(){
    sync('groups', { fields: 'sponsors,short_link', omit:'topics' }, Groups);
    sync('events', { status: 'past,upcoming,cancelled,proposed' }, Events);
    sync('photos', {}, Photos, 'photo_id');
    sync('members', { omit: 'topics' }, Members);
}

// It begins. Get meetup data and push it into local collections. Rinse. Repeat.
Meteor.startup(function(){

    console.log('\n#### Intiating Launch Sequence ####\n');

    if (!Meteor.settings || !Meteor.settings.meetupApiKey || !Meteor.settings.public){
        console.error('ABORT! ABORT!');
        console.error('The settings data is invalid. Please pass a settings file on startup.');
        console.error('\n  meteor --settings settings.json\n' );
        console.error('More info here: https://github.com/olizilla/meteor-london/blob/master/README.md');

        return;
    }

    console.log('Contacting api.meetup.com in 60s...\n');    

    if (Events.find().count() < 1){
        syncAllTheThings();    
    }
    
    Meteor.setInterval(syncAllTheThings, 1000 * 60);
});
