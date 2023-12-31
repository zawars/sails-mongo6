const createManager = require('machine').build(require('../../').createManager);
const getConnection = require('machine').build(require('../../').getConnection);
const releaseConnection = require('machine').build(require('../../').releaseConnection);

describe('Connectable ::', function() {
  describe('Release Connection', function() {
    let manager;
    let connection;

    // Create a manager and connection
    before(function(done) {
      // Needed to dynamically get the host using the docker container
      const host = process.env.WATERLINE_ADAPTER_TESTS_HOST || 'localhost';

      createManager({
        connectionString: 'mongodb://' + host + ':27017/mppg'
      })
      .exec(function(err, report) {
        if (err) {
          return done(err);
        }

        manager = report.manager;

        getConnection({
          manager: manager
        })
        .exec(function(err, report) {
          if (err) {
            return done(err);
          }

          connection = report.connection;
          return done();
        });
      });
    });

    // The actual machine is a no-op so just ensure no error comes back.
    it('should successfully release a connection', function(done) {
      releaseConnection({
        connection: connection
      })
      .exec(function(err) {
        if (err) {
          return done(err);
        }

        return done();
      });
    });
  });
});
