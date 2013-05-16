Meteor.startup(function(){
  console.log('Meteor London is alive.');

  // Meteor.subscribe('members', function(){
  //   membersGraph();
  // });
});



Template.upcomingMeetup.events = function(){
  return Events.find({time: { $gt: Date.now() }}, { sort: [['time', 'desc']]}).fetch();
};

Template.previousMeetup.events = function(){
  return Events.find({time: { $lt: Date.now() }}, { sort: [['time', 'desc']]}).fetch();
};

Template.upcomingMeetup.fromNowFormat = function(ms){
    return moment(ms).fromNow();
};

Template.upcomingMeetup.calandarFormat = function(ms){
	return moment(ms).calendar();
};

Template.upcomingMeetup.dateTimeFormat = function(ms){
	return moment(ms).format('MMMM Do YYYY, h:mm a');
};

Template.upcomingMeetup.createMap = function(venue) {
	
	setTimeout(function() {
		
		if(!venue) {
			return;
		}
		
		var latlon = [venue.lat, venue.lon];
		var map = L.map('tmp-map').setView(latlon, 13);
		
		L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png').addTo(map);
		
		L.marker(latlon).addTo(map);
		
	}, 1000);
};

Template.previousMeetup.dateFormat = function(ms){
	return moment(ms).format('MMMM Do YYYY');
};

Template.previousMeetup.toFixed = function(number){
  return parseFloat(number).toFixed(1); // rounded to 1 decimal place.
};

Template.photos.photos = function(){
  return Photos.find({}, { sort: [['created', 'desc']]}).fetch();
};

Template.members.members = function(){
  return Members.find({}, { sort: [['joined', 'desc']]}).fetch();
};

Template.upcomingMeetup.rendered = onLoad;
Template.previousMeetup.rendered = onLoad;
Template.photos.rendered = onLoad;
Template.members.rendered = function(){
  var loadings = $(this.find('.loading'));
    Meteor.defer(function(){
        loadings.removeClass('loading');
    });
  membersGraph(initSvg());
};

function onLoad(){
    var loadings = $(this.find('.loading'));
    Meteor.defer(function(){
        loadings.removeClass('loading');
    });
}
