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

        createTwitterRiver: function(riverName, tracks, indexName, bulkSize, success) {
            var twitterConfig;
            if (!_.isEmpty(config.twitter.user)) {
                twitterConfig = {
                    "user" : config.twitter.user,
                    "password" : config.twitter.password
                };
            } else {
                twitterConfig = {
                    "oauth" : config.twitterOauth,
                };
            }
            twitterConfig["filter"] = {
                "tracks" : tracks
            };
            var riverConfig = {
                "type" : "twitter",
                "twitter" : twitterConfig,
                "index" : {
                    "index" : indexName,
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

        getActiveRivers: function(success) {
            jQuery.ajax({
                url: config.uri + "/_river/_search",
                data: JSON.stringify(this.buildQueryMatchAll(0, 1000)),
                type: 'GET',
                success: function(txt) {
                    data = JSON.parse(txt);
                    var rivers = {};
                    _.forEach(data.hits.hits, function(hit) {
                        if (rivers[hit._type] == undefined) {
                            rivers[hit._type] = {};
                        }
                        rivers[hit._type][hit._id] = hit._source;
                    });
                    var riversArray = [];
                    for (riverName in rivers) {
                        rivers[riverName].name = riverName;
                        riversArray.push(rivers[riverName]);
                    }
                    success(riversArray);
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

