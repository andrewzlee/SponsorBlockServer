const request = require('request');
const { db, privateDB } = require('../../src/databases/databases.js');
const utils = require('../utils.js');
const getHash = require('../../src/utils/getHash.js');

describe('voteOnSponsorTime', () => {
  before(() => {
    let startOfQuery = "INSERT INTO sponsorTimes (videoID, startTime, endTime, votes, UUID, userID, timeSubmitted, views, category, shadowHidden) VALUES";
    db.exec(startOfQuery + "('vote-testtesttest', 1, 11, 2, 'vote-uuid-0', 'testman', 0, 50, 'sponsor', 0)");
    db.exec(startOfQuery + "('vote-testtesttest2', 1, 11, 2, 'vote-uuid-1', 'testman', 0, 50, 'sponsor', 0)");
    db.exec(startOfQuery + "('vote-testtesttest2', 1, 11, 10, 'vote-uuid-1.5', 'testman', 0, 50, 'outro', 0)");
    db.exec(startOfQuery + "('vote-testtesttest2', 1, 11, 10, 'vote-uuid-1.6', 'testman', 0, 50, 'interaction', 0)");
    db.exec(startOfQuery + "('vote-testtesttest3', 20, 33, 10, 'vote-uuid-2', 'testman', 0, 50, 'intro', 0)");
    db.exec(startOfQuery + "('vote-testtesttest,test', 1, 11, 100, 'vote-uuid-3', 'testman', 0, 50, 'sponsor', 0)");
    db.exec(startOfQuery + "('vote-test3', 1, 11, 2, 'vote-uuid-4', 'testman', 0, 50, 'sponsor', 0)");
    db.exec(startOfQuery + "('vote-test3', 7, 22, -3, 'vote-uuid-5', 'testman', 0, 50, 'intro', 0)");
    db.exec(startOfQuery + "('vote-multiple', 1, 11, 2, 'vote-uuid-6', 'testman', 0, 50, 'intro', 0)");
    db.exec(startOfQuery + "('vote-multiple', 20, 33, 2, 'vote-uuid-7', 'testman', 0, 50, 'intro', 0)");
    db.exec(startOfQuery + "('voter-submitter', 1, 11, 2, 'vote-uuid-8', '" + getHash("randomID") + "', 0, 50, 'sponsor', 0)");
    db.exec(startOfQuery + "('voter-submitter2', 1, 11, 2, 'vote-uuid-9', '" + getHash("randomID2") + "', 0, 50, 'sponsor', 0)");
    db.exec(startOfQuery + "('voter-submitter2', 1, 11, 2, 'vote-uuid-10', '" + getHash("randomID3") + "', 0, 50, 'sponsor', 0)");
    db.exec(startOfQuery + "('voter-submitter2', 1, 11, 2, 'vote-uuid-11', '" + getHash("randomID4") + "', 0, 50, 'sponsor', 0)");
    db.exec(startOfQuery + "('own-submission-video', 1, 11, 500, 'own-submission-uuid', '"+ getHash('own-submission-id') +"', 0, 50, 'sponsor', 0)");
    db.exec(startOfQuery + "('not-own-submission-video', 1, 11, 500, 'not-own-submission-uuid', '"+ getHash('somebody-else-id') +"', 0, 50, 'sponsor', 0)");

    db.exec("INSERT INTO vipUsers (userID) VALUES ('" + getHash("VIPUser") + "')");
    privateDB.exec("INSERT INTO shadowBannedUsers (userID) VALUES ('" + getHash("randomID4") + "')");
  }); 

  it('Should be able to upvote a segment', (done) => {
    request.get(utils.getbaseURL() 
     + "/api/voteOnSponsorTime?userID=randomID&UUID=vote-uuid-0&type=1", null, 
      (err, res, body) => {
        if (err) done(err);
        else if (res.statusCode === 200) {
          let row = db.prepare('get', "SELECT votes FROM sponsorTimes WHERE UUID = ?", ["vote-uuid-0"]);
          if (row.votes === 3) {
            done()
          } else {
            done("Vote did not succeed. Submission went from 2 votes to " + row.votes);
          }
        } else {
          done("Status code was " + res.statusCode);
        }
    });
  });

  it('Should be able to downvote a segment', (done) => {
    request.get(utils.getbaseURL() 
     + "/api/voteOnSponsorTime?userID=randomID2&UUID=vote-uuid-2&type=0", null, 
      (err, res, body) => {
        if (err) done(err);
        else if (res.statusCode === 200) {
          let row = db.prepare('get', "SELECT votes FROM sponsorTimes WHERE UUID = ?", ["vote-uuid-2"]);
          if (row.votes < 10) {
            done()
          } else {
            done("Vote did not succeed. Submission went from 10 votes to " + row.votes);
          }
        } else {
          done("Status code was " + res.statusCode);
        }
    });
  });

  it('Should not be able to downvote the same segment when voting from a different user on the same IP', (done) => {
    request.get(utils.getbaseURL() 
     + "/api/voteOnSponsorTime?userID=randomID3&UUID=vote-uuid-2&type=0", null, 
      (err, res, body) => {
        if (err) done(err);
        else if (res.statusCode === 200) {
          let row = db.prepare('get', "SELECT votes FROM sponsorTimes WHERE UUID = ?", ["vote-uuid-2"]);
          if (row.votes === 9) {
            done()
          } else {
            done("Vote did not fail. Submission went from 9 votes to " + row.votes);
          }
        } else {
          done("Status code was " + res.statusCode);
        }
    });
  });

  it("Should not be able to downvote a segment if the user is shadow banned", (done) => {
    request.get(utils.getbaseURL() 
     + "/api/voteOnSponsorTime?userID=randomID4&UUID=vote-uuid-1.6&type=0", null, 
      (err, res, body) => {
        if (err) done(err);
        else if (res.statusCode === 200) {
          let row = db.prepare('get', "SELECT votes FROM sponsorTimes WHERE UUID = ?", ["vote-uuid-1.6"]);
          if (row.votes === 10) {
            done()
          } else {
            done("Vote did not fail. Submission went from 10 votes to " + row.votes);
          }
        } else {
          done("Status code was " + res.statusCode);
        }
    });
  });

  it("Should not be able to upvote a segment if the user hasn't submitted yet", (done) => {
    request.get(utils.getbaseURL() 
     + "/api/voteOnSponsorTime?userID=hasNotSubmittedID&UUID=vote-uuid-1&type=1", null, 
      (err, res, body) => {
        if (err) done(err);
        else if (res.statusCode === 200) {
          let row = db.prepare('get', "SELECT votes FROM sponsorTimes WHERE UUID = ?", ["vote-uuid-1"]);
          if (row.votes === 2) {
            done()
          } else {
            done("Vote did not fail. Submission went from 2 votes to " + row.votes);
          }
        } else {
          done("Status code was " + res.statusCode);
        }
    });
  });

  it("Should not be able to downvote a segment if the user hasn't submitted yet", (done) => {
    request.get(utils.getbaseURL() 
     + "/api/voteOnSponsorTime?userID=hasNotSubmittedID&UUID=vote-uuid-1.5&type=0", null, 
      (err, res, body) => {
        if (err) done(err);
        else if (res.statusCode === 200) {
          let row = db.prepare('get', "SELECT votes FROM sponsorTimes WHERE UUID = ?", ["vote-uuid-1.5"]);
          if (row.votes === 10) {
            done()
          } else {
            done("Vote did not fail. Submission went from 10 votes to " + row.votes);
          }
        } else {
          done("Status code was " + res.statusCode);
        }
    });
  });

  it('VIP should be able to completely downvote a segment', (done) => {
    request.get(utils.getbaseURL() 
     + "/api/voteOnSponsorTime?userID=VIPUser&UUID=vote-uuid-3&type=0", null, 
      (err, res, body) => {
        if (err) done(err);
        else if (res.statusCode === 200) {
          let row = db.prepare('get', "SELECT votes FROM sponsorTimes WHERE UUID = ?", ["vote-uuid-3"]);
          if (row.votes <= -2) {
            done()
          } else {
            done("Vote did not succeed. Submission went from 100 votes to " + row.votes);
          }
        } else {
          done("Status code was " + res.statusCode);
        }
    });
  });

  it('should be able to completely downvote your own segment', (done) => {
    request.get(utils.getbaseURL() 
     + "/api/voteOnSponsorTime?userID=own-submission-id&UUID=own-submission-uuid&type=0", null, 
      (err, res, body) => {
        if (err) done(err);
        else if (res.statusCode === 200) {
          let row = db.prepare('get', "SELECT votes FROM sponsorTimes WHERE UUID = ?", ["own-submission-uuid"]);
          if (row.votes <= -2) {
            done()
          } else {
            done("Vote did not succeed. Submission went from 500 votes to " + row.votes);
          }
        } else {
          done("Status code was " + res.statusCode);
        }
    });
  });

  it('should not be able to completely downvote somebody elses segment', (done) => {
    request.get(utils.getbaseURL() 
     + "/api/voteOnSponsorTime?userID=randomID2&UUID=not-own-submission-uuid&type=0", null, 
      (err, res, body) => {
        if (err) done(err);
        else if (res.statusCode === 200) {
          let row = db.prepare('get', "SELECT votes FROM sponsorTimes WHERE UUID = ?", ["not-own-submission-uuid"]);
          if (row.votes === 499) {
            done()
          } else {
            done("Vote did not succeed. Submission went from 500 votes to " + row.votes);
          }
        } else {
          done("Status code was " + res.statusCode);
        }
    });
  });

  it('Should be able to vote for a category and it should immediately change (for now)', (done) => {
    request.get(utils.getbaseURL() 
     + "/api/voteOnSponsorTime?userID=randomID2&UUID=vote-uuid-4&category=intro", null, 
      (err, res, body) => {
        if (err) done(err);
        else if (res.statusCode === 200) {
          let row = db.prepare('get', "SELECT category FROM sponsorTimes WHERE UUID = ?", ["vote-uuid-4"]);
          if (row.category === "intro") {
            done()
          } else {
            done("Vote did not succeed. Submission went from sponsor to " + row.category);
          }
        } else {
          done("Status code was " + res.statusCode);
        }
    });
  });

  it('Should be able to change your vote for a category and it should immediately change (for now)', (done) => {
    request.get(utils.getbaseURL() 
     + "/api/voteOnSponsorTime?userID=randomID2&UUID=vote-uuid-4&category=outro", null, 
      (err, res, body) => {
        if (err) done(err);
        else if (res.statusCode === 200) {
          let row = db.prepare('get', "SELECT category FROM sponsorTimes WHERE UUID = ?", ["vote-uuid-4"]);
          if (row.category === "outro") {
            done()
          } else {
            done("Vote did not succeed. Submission went from intro to " + row.category);
          }
        } else {
          done("Status code was " + res.statusCode);
        }
    });
  });

  it('VIP should be able to vote for a category and it should immediately change', (done) => {
    request.get(utils.getbaseURL() 
     + "/api/voteOnSponsorTime?userID=VIPUser&UUID=vote-uuid-5&category=outro", null, 
      (err, res, body) => {
        if (err) done(err);
        else if (res.statusCode === 200) {
          let row = db.prepare('get', "SELECT category FROM sponsorTimes WHERE UUID = ?", ["vote-uuid-5"]);
          let row2 = db.prepare('get', "SELECT votes FROM categoryVotes WHERE UUID = ? and category = ?", ["vote-uuid-5", "outro"]);
          if (row.category === "outro" && row2.votes === 500) {
            done()
          } else {
            done("Vote did not succeed. Submission went from intro to " + row.category + ". Category votes are " + row2.votes + " and should be 500.");
          }
        } else {
          done("Status code was " + res.statusCode);
        }
    });
  });

  it('Should not be able to category-vote on an invalid UUID submission', (done) => {
    request.get(utils.getbaseURL() 
     + "/api/voteOnSponsorTime?userID=randomID3&UUID=invalid-uuid&category=intro", null, 
      (err, res, body) => {
        if (err) done(err);
        else if (res.statusCode === 400) {
          done();
        } else {
          done("Status code was " + res.statusCode + " instead of 400.");
        }
    });
  });

  it('Non-VIP should not be able to upvote "dead" submission', (done) => {
    request.get(utils.getbaseURL() 
     + "/api/voteOnSponsorTime?userID=randomID2&UUID=vote-uuid-5&type=1", null, 
      (err, res, body) => {
        if (err) done(err);
        else if (res.statusCode === 403) {
          done();
        } else {
          done("Status code was " + res.statusCode + " instead of 403");
        }
    });
  });

  it('VIP should be able to upvote "dead" submission', (done) => {
    request.get(utils.getbaseURL() 
     + "/api/voteOnSponsorTime?userID=VIPUser&UUID=vote-uuid-5&type=1", null, 
      (err, res, body) => {
        if (err) done(err);
        else if (res.statusCode === 200) {
          let row = db.prepare('get', "SELECT votes FROM sponsorTimes WHERE UUID = ?", ["vote-uuid-5"]);
          if (row.votes > -3) {
            done()
          } else {
            done("Vote did not succeed. Votes raised from -3 to " + row.votes);
          }
        } else {
          done("Status code was " + res.statusCode);
        }
    });
  });

});