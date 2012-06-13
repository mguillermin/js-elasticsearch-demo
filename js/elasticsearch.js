var elasticSearch = (function(config){
    var config = config;
    return {
        search: function(index, type, query, success) {
            if (!_.isString(query)) {
                query = JSON.stringify(query);
            }
            var fullUri = config.uri;
            if (!_.isEmpty(index)) {
                fullUri += '/' + index;
            }
            if (!_.isEmpty(type)) {
                fullUri += '/' + type;
            }
            fullUri += '/_search';
            jQuery.ajax({
                url: fullUri,
                data: query,
                type: 'POST',
                success: function(txt){
                    success(JSON.parse(txt));
                }
            });
        },

        createTwitterRiver: function(riverName, tracks, bulkSize, success) {
            var riverConfig = {
                "type" : "twitter",
                "twitter" : {
                    "oauth" : config.twitterOauth,
                    "filter": {
                        "tracks" : tracks
                    }
                },
                "index" : {
                    "index" : riverName,
                    "type" : "status",
                    "bulk_size" : bulkSize
                }

            }
            jQuery.ajax({
                url: config.uri + "/_river/" + riverName + "/_meta",
                data: JSON.stringify(riverConfig),
                type: 'PUT',
                success: function(txt) {
                    success(JSON.parse(txt));
                }
            });
        },

        deleteTwitterRiver: function(riverName, success) {
            jQuery.ajax({
                url: config.uri + "/_river/" + riverName,
                type: 'DELETE',
                success: function(txt) {
                    success(JSON.parse(txt));
                }
            });
        },

        buildQueryMatchAll: function(from, size) {
            return {
                "query" : {
                    "match_all" : {}
                },
                "from" : from,
                "size": size
            };
        },

        buildQueryStringQuery: function(q, from, size) {
            return {
                "query" : {
                    "query_string" : {
                        "query" : q
                    }
                },
                "from" : from,
                "size": size
            };
        }
    }
});

