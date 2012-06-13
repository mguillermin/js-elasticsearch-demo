/* Author:

*/

var retrieveConfig = function(){
    var storedValues = store.getAll();
    return {
        uri: storedValues.es_uri,
        twitterOauth : {
            "consumerKey": storedValues.twitter_consumerKey,
            "consumerSecret": storedValues.twitter_consumerSecret,
            "accessToken": storedValues.twitter_accessToken,
            "accessTokenSecret" : storedValues.twitter_accessTokenSecret
        }
    };
};

var es = elasticSearch(retrieveConfig());

$('ul.nav li a').click(function(){
    $('.target').hide();
    $('#'+$(this).data('target')).show();
    var parentLi = $(this).closest('li');
    parentLi.siblings().removeClass('active');
    parentLi.addClass('active');
});

$('#start-track form').submit(function(event){
    var track = $(this).find('input[name="track"]').val();
    var riverName = $(this).find('input[name="river"]').val();
    es.createTwitterRiver(riverName, options.twitterOauth, track, 1, function(data){
        console.log(data);
        $('#start-track').hide();
        $('#stop-track').show();
    });
    return false;
});

$('#stop-track form').submit(function(){
    var riverName = $(this).find('input[name="river"]').val();
    es.deleteTwitterRiver(riverName, function(data){
        console.log(data);
        $('#stop-track').hide();
        $('#start-track').show();
    });
    return false;
});

var resultTemplate = "<h2>Total : {{total}}</h2> " +
    "<p>Search took {{took}} ms</p>" +
    "<ul>" +
    "{{#hits.hits}}" +
    '<li><a href="http://twitter.com/{{_source.user.screen_name}}">{{_source.user.screen_name}}</a> : <a href="http://twitter.com/{{_source.user.screen_name}}/status/{{_id}}">{{_source.text}}</a></li>' +
    "{{/hits.hits}}" +
    "</ul>";

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

var alertTemplate = '<div class="alert alert-{{type}} fade in out"><a class="close" data-dismiss="alert" href="#">&times;</a><h4 class="alert-heading">{{title}}</h4>{{message}}</div>';

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
    configStorage();
});

