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

var config = module.exports = {
 firehose : {
  DeliveryStreamName: 'barabatta', /* required */
  S3DestinationConfiguration: {
    BucketARN: 'arn:aws:s3:::twitter-cc', /* required if stream not exists */
    RoleARN: 'arn:aws:iam::688346952891:role/firehose_delivery_role', /* required if stream not exists */
    BufferingHints: {
      IntervalInSeconds: 300,
      SizeInMBs: 5
    },
    CompressionFormat: 'UNCOMPRESSED', /* 'UNCOMPRESSED | GZIP | ZIP | Snappy' */
    EncryptionConfiguration: {
      NoEncryptionConfig: 'NoEncryption'
    },
    Prefix: 'twitter/raw-data/'  /* if stream not exists. example: twitter/raw-data/  */
  }
  },
  twitter: {
      consumer_key: 'jesW6fMDLiuB7csTFN0DiG5kt',
      consumer_secret: 'JyOC33r4VFJbx9GPDOzbh0YLlIVZxlWtOnMp5mWKqDaOvjN9A0',
      access_token: '1603443058032377857-ppEDGN6oq7qXQMfCOW9OlcbCyMP0ni',
      access_token_secret: 'hTiI5yNAvi9lAtRU6lbuscmH6FoBVtbok6sWqw2mOeUDK'
 },
 locations: ['-127.33,23.34,-55.52,49.56'], //US   (All the world:'-180,-90,180,90; New York City:-74,40,-73,41; San Francisco:-122.75,36.8,-121.75,37.8, US:-127.33,23.34,-55.52,49.56)
 waitBetweenDescribeCallsInSeconds: 2,
 recordsToWritePerBatch: 100,
 waitBetweenPutRecordsCallsInMilliseconds: 50,
 region: 'us-east-1'
};
