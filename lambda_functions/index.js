const Jimp = require('jimp');
var aws = require('aws-sdk');
const http = require('http');
var Q = require('q');
var cloudfront = new aws.CloudFront();

// return filename without extension
function baseName(path) {
  return path.split('/').reverse()[0].split('.')[0];
}

var key1 = "";
exports.handler = function (event, context) {
  var bucket = event.Records[0].s3.bucket.name;
  var key = event.Records[0].s3.object.key;
  console.log('Bucket: ' + bucket);
  console.log('Key: ' + key);
  var image = new Jimp("https://d10lpgp6xz60nq.cloudfront.net/" + event.Records[0].s3.object.key, (err, image) => {
    console.log("Error")
    console.log(err)
    var w = image.bitmap.width; //  width of the image
    var h = image.bitmap.height; // height of the image
    console.log("width : " + w + " height : " + h);
    const options = {
      host: '52.230.70.47',
      path: '/image_dimension_hook.php?image=https://d10lpgp6xz60nq.cloudfront.net/' + event.Records[0].s3.object.key + '&height=' + h + '&width=' + w
    };
    const req = http.get(options, (res) => {
      cloudfront.listDistributions({}, function (err, data) {
        var promises = [];
        if (err) {
          _log('Error: ', err);
          context.done('error', err);
          return;
        }

        // Find a bucket which uses the backet as a origin.
        data.Items.map(function (distribution) {
          var deferred = Q.defer();
          var exists = false;
          distribution.Origins.Items.map(function (origin) {
            if (exists) return;

            if (origin.DomainName.indexOf(bucket) === 0) {
              exists = true;
              var name = distribution.DomainName;
              if (distribution.Aliases.Quantity > 0) {
                name = distribution.Aliases.Items[0];
              }
              console.log('Distribution: ' + distribution.Id + ' (' + name + ')');

              // Parameters for a invalidation
              var params = {
                DistributionId: distribution.Id,
                InvalidationBatch: {
                  CallerReference: '' + new Date().getTime(),
                  Paths: {
                    Quantity: 1,
                    Items: ['/' + key]
                  }
                }
              };
              _log('Params: ', params);

              // Invalidate
              cloudfront.createInvalidation(params, function (err, data) {
                if (err) {
                  _log('Error: ', err);
                  deferred.reject();
                  return;
                }
                _log('Success: ', data.InvalidationBatch);
                deferred.resolve();
              });
            }
          });
          if (!exists) deferred.resolve();
          promises.push(deferred.promise);
        });
        Q.all(promises).then(function () {
          context.done(null, '');
        });
      });
      console.log(res);
    });
  })


  function _log(caption, object) {
    console.log(caption + JSON.stringify(object, true, '  '));
  }


}

