angular.module('cesium.es.wot.services', ['ngResource', 'cesium.es.http.services'])

  .factory('esWot', function($q, esHttp) {
    'ngInject';

    var
      raw = {
          user: {
            event: esHttp.post('/user/event/_search?pretty')
          }
        },

      loadMemberships = function(pubkey) {

        // Get user events on membership state
        var request = {
          "size": 1000,
          "query": {
            "bool": {
              "filter": [
                {"term": {"recipient" : pubkey }},
                {"terms": {"code" : ["MEMBER_JOIN","MEMBER_ACTIVE","MEMBER_LEAVE","MEMBER_EXCLUDE","MEMBER_REVOKE"] }}
              ]
            }
          },
          "sort" : [
            { "time" : {"order" : "asc"}}
          ],
          _source: ["code", "time"]
        };

        return raw.user.event(request)

          .then(function(res) {
            if (!res.hits || !res.hits.total) return;

            // Compute member periods
            var lastJoinTime;
            var result = res.hits.hits.reduce(function(res, hit){
              var isMember = hit._source.code == 'MEMBER_JOIN' || hit._source.code == 'MEMBER_ACTIVE';
              // If join
              if (isMember && !lastJoinTime) {
                lastJoinTime = hit._source.time;
              }
              // If leave
              else if (!isMember && lastJoinTime) {
                // Add an entry
                res = res.concat({
                  joinTime: lastJoinTime,
                  leaveTime: hit._source.time
                });
                lastJoinTime = 0; // reset
              }
              return res;
            }, []);

            if (lastJoinTime) {
              // Add last entry if need
              result.push({
                joinTime: lastJoinTime,
                leaveTime: moment().utc().unix()
              });
            }

            return result;
          });
      };

    return {
      memberships: loadMemberships
    };
  });
