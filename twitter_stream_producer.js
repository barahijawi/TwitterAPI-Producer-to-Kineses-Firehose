/***
Copyright 2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License").
You may not use this file except in compliance with the License.
A copy of the License is located at

http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed
on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
express or implied. See the License for the specific language governing
permissions and limitations under the License.
***/

'use strict';

var config = require('./config');
var Twit = require('twitter-api-v2');
var util = require('util');
var logger = require('./util/logger');
const {ETwitterStreamEvent} = require("twitter-api-v2");

function twitterStreamProducer(firehose) {
  var log = logger().getLogger('producer');
  var waitBetweenPutRecordsCallsInMilliseconds = config.waitBetweenPutRecordsCallsInMilliseconds;
  // var T = new Twit(config.twitter)
  const client = new Twit.TwitterApi('AAAAAAAAAAAAAAAAAAAAAA%2FhkQEAAAAAmuHVI0ML%2Bd0Xrh5N2cvV9DnwHAo%3DPFvM9o9mg1I6Lsuc9ErhOkO93rXm2dZeDQtgmUgi6YTocJYj6f');


  // Creates a new kinesis stream if one doesn't exist.
  function _createStreamIfNotCreated(callback) {
    firehose.describeDeliveryStream({DeliveryStreamName: config.firehose.DeliveryStreamName}, function(err, data) {
      if (err) {
        firehose.createDeliveryStream(config.firehose, function(err, data) {
          if (err) {
            // ResourceInUseException is returned when the stream is already created.
            if (err.code !== 'ResourceInUseException') {
              console.log(err);
              callback(err);
              return;
            }
            else {
              var msg = util.format('%s stream is already created! Re-using it.', config.firehose.DeliveryStreamName);
              console.log(msg);
              log.info(msg);
            }
          }
          else {
            var msg = util.format('%s stream does not exist. Created a new stream with that name.', config.firehose.DeliveryStreamName);
            console.log(msg);
            log.info(msg);
          }
          // Poll to make sure stream is in ACTIVE state before start pushing data.
          _waitForStreamToBecomeActive(callback);
        });
      }
      else {
        var msg = util.format('%s stream is already created! Re-using it.', config.firehose.DeliveryStreamName);
        console.log(msg);
        log.info(msg);
      }

      // Poll to make sure stream is in ACTIVE state before start pushing data.
      _waitForStreamToBecomeActive(callback);
    });

    
  }

  // Checks current status of the stream.
  function _waitForStreamToBecomeActive(callback) {
    firehose.describeDeliveryStream({DeliveryStreamName: config.firehose.DeliveryStreamName}, function(err, data) {
      if (!err) {
        if (data.DeliveryStreamDescription.DeliveryStreamStatus === 'ACTIVE') {
          log.info('Current status of the stream is ACTIVE.');
          callback(null);
        }
        else {
          var msg = util.format('Current status of the stream is %s.', data.DeliveryStreamDescription.DeliveryStreamStatus);
          console.log(msg);
          log.info(msg);
          setTimeout(function() {
            _waitForStreamToBecomeActive(callback);
          }, 1000 * config.waitBetweenDescribeCallsInSeconds);
        }
      }
    });
  }


  async function _sendToFirehose (){
    var recordParams = {};
    const rules = await client.v2.streamRules();
    if (rules.data?.length) {
      await client.v2.updateStreamRules({
        delete: { ids: rules.data.map(rule => rule.id) },
      });
    }

// Add our rules
    await client.v2.updateStreamRules({
      add: [{ value: 'has:geo place_country:US has:hashtags' }],
    });

    const stream = await client.v2.searchStream({
      'tweet.fields': ['referenced_tweets', 'author_id','entities','created_at'],
      'user.fields' : ['id','location','name','username','description'],
      'place.fields':['full_name','country','geo'],
      expansions: ['referenced_tweets.id','geo.place_id','entities.mentions.username'],
    });
// Enable auto reconnect
    stream.autoReconnect = true;

    stream.on(ETwitterStreamEvent.Data, async tweet => {
      // Ignore RTs or self-sent tweets
      // const isARt = tweet.data.referenced_tweets?.some(tweet => tweet.type === 'retweeted') ?? false;
      // if (isARt || tweet.data.author_id === meAsUser.id_str) {
      //   return;
      // }
        if (tweet !== null){
          console.log(JSON.stringify(tweet));
          recordParams = {
            DeliveryStreamName: config.firehose.DeliveryStreamName,
            Record: {
              Data: JSON.stringify(tweet)+',\n'
            }
          };
          firehose.putRecord(recordParams, function(err, data) {
            if (err) {
              log.error(err);
            }
          });

        }

    });
  }
  // function _sendToFirehose_old() {
  //   // var locations = [ '-180,-90,180,90' ]; //all the world
  //   var stream = T.stream('statuses/filter', { locations: config.locations });
  //
  //   var records = [];
  //   var record = {};
  //   var recordParams = {};
  //   stream.on('tweet', function (tweet) {
  //      if (tweet.coordinates){
  //           if (tweet.coordinates !== null){
  //             console.log(JSON.stringify(tweet));
  //             recordParams = {
  //                 DeliveryStreamName: config.firehose.DeliveryStreamName,
  //                 Record: {
  //                   Data: JSON.stringify(tweet)+',\n'
  //                 }
  //             };
  //             firehose.putRecord(recordParams, function(err, data) {
  //               if (err) {
  //                 log.error(err);
  //               }
  //             });
  //
  //         }
  //       }
  //   });
  // }


  return {
    run: function() {
      log.info(util.format('Configured wait between consecutive PutRecords call in milliseconds: %d',
          waitBetweenPutRecordsCallsInMilliseconds));
      _createStreamIfNotCreated(function(err) {
        if (err) {
          log.error(util.format('Error creating stream: %s', err));
          return;
        }

        _sendToFirehose();
      });
    }
  };
}

module.exports = twitterStreamProducer;
