/**
 * Template for an alert box
 * @type {String}
 */
var alertTemplate = '<div class="alert alert-{{type}} fade in out"><a class="close" data-dismiss="alert" href="#">&times;</a><h4 class="alert-heading">{{title}}</h4>{{message}}</div>';

/**
 * Template for displaying search results
 * @type {String}
 */
var resultTemplate = "<h2>Total : {{hits.total}}</h2> " +
    "<p>Search took {{took}} ms</p>" +
    "<ul>" +
    "{{#hits.hits}}" +
    '<li><a href="http://twitter.com/{{_source.user.screen_name}}">{{_source.user.screen_name}}</a> : <a href="http://twitter.com/{{_source.user.screen_name}}/status/{{_id}}">{{_source.text}}</a></li>' +
    "{{/hits.hits}}" +
    "</ul>";

var trackingListTemplate =
    "{{#rivers}}" +
    '<li>Name : {{name}} - Index : {{_meta.index.index}} - Tracks : {{_meta.twitter.filter.tracks}} - Ok : {{_status.ok}}</li>' +
    "{{/rivers}}";

/**
 * Retrieve configuration from the local storage
 * @return {Object}
 */
var retrieveConfig = function(){
    var storedValues = store.getAll();
    return {
        uri: storedValues.es_uri,
        twitter: {
            "user": storedValues.twitter_user,
            "password": storedValues.twitter_password
        },
        twitterOauth : {
            "consumerKey": storedValues.twitter_consumerKey,
            "consumerSecret": storedValues.twitter_consumerSecret,
            "accessToken": storedValues.twitter_accessToken,
            "accessTokenSecret" : storedValues.twitter_accessTokenSecret
        }
    };
};

/**
 * Initialize navigation
 */
var nav = function(){
    $('ul.nav li a').click(function(){
        $('.target').hide();
        $('#'+$(this).data('target')).show();
        var parentLi = $(this).closest('li');
        parentLi.siblings().removeClass('active');
        parentLi.addClass('active');
    });
};

/**
 * Initialize tracking
 */
var tracking = function(){
    $('#start-track form').submit(function(event){
        var track = $(this).find('input[name="track"]').val();
        var riverName = $(this).find('input[name="river"]').val();
        var indexName = $(this).find('input[name="index"]').val();
        es.createTwitterRiver(riverName, track, indexName, 1, function(data){
            console.log(data);
            setTimeout(refreshTrackings, 1000);
        });
        return false;
    });

    $('#stop-track form').submit(function(){
        var riverName = $(this).find('input[name="river"]').val();
        es.deleteTwitterRiver(riverName, function(data){
            console.log(data);
            setTimeout(refreshTrackings, 1000);
        });
        return false;
    });

    $('#trackings-refresh').click(function(){
        refreshTrackings();
    });
    refreshTrackings();
};

var refreshTrackings = function(){
    es.getActiveRivers(function(rivers){
        var trackingList = $.mustache(trackingListTemplate, {"rivers": rivers});
        $('#trackings-list').empty().append(trackingList);
    });
};


/**
 * Initialize search
 */
var search = function(){
    $('#search form').submit(function(){
        var index = $(this).find('input[name="index"]').val();
        var q = $(this).find('input[name="query"]').val();
        var from = $(this).find('input[name="from"]').val();
        var size = $(this).find('input[name="size"]').val();
        var query;
        if (_.isEmpty(q)) {
            query = es.buildQueryMatchAll(from, size);
        } else {
            query = es.buildQueryStringQuery(q, from, size);
        }
        es.search(index, null, query, function(data){
            var result = $.mustache(resultTemplate, data);
            $('#results').empty().append(result);
        });
        return false;
    });
};

/**
 * Initialize config storage
 */
var configStorage = function(){
    if (store.disabled) {
        $('#config').prepend($.mustache(alertTemplate, {type: "error", title: "Warning!", message:"Local storage is not enabled. Configuration cannot be saved."})).alert();
    } else {
        // Input values initialization
        $('#config form input').each(function(){
            $(this).val(store.get($(this).attr('name')));
        });
        // Binding submit event on config form
        $('#config form').submit(function(){
            // We save every input of the form
            $(this).find('input').each(function(){
                store.set($(this).attr('name'), $(this).val());
            });
            // After saving, elasticSearch config needs to be reloaded
            es = elasticSearch(retrieveConfig());
            // Displaying a message and dismissing it after a few seconds
            $('#config').prepend($.mustache(alertTemplate, {type: "success", title: "Config saved !", message:"Configuration has been saved using Local storage."})).alert();
            setTimeout(function(){
                $('#config .alert').alert('close');
            }, 3000);
            return false;
        });
    }
}

$(document).ready(function(){
    nav();
    tracking();
    search();
    configStorage();
});

var es = elasticSearch(retrieveConfig());

