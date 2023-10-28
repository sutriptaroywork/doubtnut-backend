
const Redis = require("ioredis");

var cluster = new Redis({
  host:"dn-prod-redis.jro06t.ng.0001.aps1.cache.amazonaws.com",
  port:6379
})

module.exports.handler = async (event, context) => {

cluster.del(prefix+'dailyleaderboard');

var daily_point_stream = cluster.scanStream({ match: 'daily_point*',count: 100 });
daily_point_stream.on('data', function (resultKeys) {
  for (var i = 0 i < resultKeys.length; i++) {
    console.log(resultKeys[i])
    cluster.del(resultKeys[i])
  }
})
daily_point_stream.on('end', function () {
  console.log('all keys  daily_point deleted');
});

var user_g_action_summary = cluster.scanStream({ match: 'user_g_action_summary*',count: 100 });
user_g_action_summary.on('data', function (resultKeys) {
  for (var i = 0; i < resultKeys.length; i++) {
    console.log(resultKeys[i])
    cluster.del(resultKeys[i])
  }
})
user_g_action_summary.on('end', function () {
  console.log('all keys  user_g_action_summary deleted');
});
}
