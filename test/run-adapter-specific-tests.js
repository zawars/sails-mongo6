const assert = require('assert');
const _ = require('@sailshq/lodash');
const Waterline = require('waterline');
const waterlineUtils = require('waterline-utils');
const normalizeDatastoreConfig = require('../lib/private/normalize-datastore-config');


let waterline;
let models = {};

describe('normalizeDatastoreConfig', function() {

  it('Given a URL without a prefix, normalizeDatastoreConfig should add the prefix', function() {
    const config = {
      url: 'creepygiggles:shipyard4eva@localhost/test'
    };
    normalizeDatastoreConfig(config, undefined, 'mongodb');
    assert.equal(config.url, 'mongodb://creepygiggles:shipyard4eva@localhost/test');
  });

  it('Given a URL with a comma in it (like a Mongo Atlas URL), normalizeDatastoreConfig should not modify the URL.', function() {
    const url = 'mongodb://creepygiggles:shipyard4eva@cluster0-shard-00-00-ienyq.mongodb.net:27017,cluster0-shard-00-01-ienyq.mongodb.net:27017,cluster0-shard-00-02-ienyq.mongodb.net:27017/test?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin';
    const config = {
      url: 'mongodb://creepygiggles:shipyard4eva@cluster0-shard-00-00-ienyq.mongodb.net:27017,cluster0-shard-00-01-ienyq.mongodb.net:27017,cluster0-shard-00-02-ienyq.mongodb.net:27017/test?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin'
    };
    normalizeDatastoreConfig(config);
    assert.equal(url, config.url);
  });

});

describe('aggregations', function() {

  describe('Using `sum`', function() {

    before(function(done) {
      setup(
        [createModel('user', {dontUseObjectIds: true})],
        models,
        done
      );
    });

    after(function(done) {
      models = {};
      if (waterline) {
        return waterline.teardown(done);
      }
      return done();
    });

    it('should not throw an error if the given criteria don\'t match any records', function(done) {
      models.user.sum('id', {name: 'joe'}).exec(function(err, sum) {
        if (err) { return done(err); }
        assert.equal(sum, 0);
        return done();
      });
    });

  });


  describe('Using `avg`', function() {

    before(function(done) {
      setup(
        [createModel('user', {dontUseObjectIds: true})],
        models,
        done
      );
    });

    after(function(done) {
      models = {};
      if (waterline) {
        return waterline.teardown(done);
      }
      return done();
    });

    it('should not throw an error if the given critieria don\'t match any records', function(done) {
      models.user.avg('id', {name: 'joe'}).exec(function(err, avg) {
        if (err) { return done(err); }
        assert.equal(avg, 0);
        return done();
      });
    });

  });

});

describe('dontUseObjectIds', function() {

  describe('Without associations', function() {

    afterEach(function(done) {
      models = {};
      if (waterline) {
        return waterline.teardown(done);
      }
      return done();
    });

    beforeEach(function(done) {
      setup(
        [createModel('user', {dontUseObjectIds: true})],
        models,
        done
      );
    });

    describe('Creating a single record', function() {

      it('should create a record w/ a numeric ID', function(done) {

        models.user.create({id: 123, name: 'bob'}).exec(function(err, record) {
          if (err) {return done(err);}
          assert.equal(record.id, 123);
          assert.equal(record.name, 'bob');
          return done();
        });

      });

    });

    describe('Creating multiple records', function() {

      it('should create multiple record w/ a numeric ID', function(done) {

        models.user.createEach([{id: 123, name: 'sid'},{id: 555, name: 'nancy'}]).exec(function(err, records) {
          if (err) {return done(err);}
          assert.equal(records[0].id, 123);
          assert.equal(records[0].name, 'sid');
          assert.equal(records[1].id, 555);
          assert.equal(records[1].name, 'nancy');
          return done();
        });

      });

    });

    describe('Updating a single record', function() {

      it('should update the record correctly', function(done) {
        models.user._adapter.datastores.test.manager.collection('user').insertOne({_id: 123, name: 'bob'})
        .then(function insertCb() {
          models.user.updateOne({id: 123}, {name: 'joe'}).exec(function(err, record) {
            if (err) {return done(err);}
            assert.equal(record.id, 123);
            assert.equal(record.name, 'joe');
            return done();
          });

        }).catch(function (err) { return done(err); });

      });

    });

    describe('Updating multiple records', function() {

      it('should update the records correctly', function(done) {

        models.user._adapter.datastores.test.manager.collection('user').insertMany([{_id: 123, name: 'sid'}, {_id: 555, name: 'nancy'}])
        .then(function insertManyCb() {
          models.user.update({id: {'>': 0}}, {name: 'joe'}).exec(function(err, records) {
            if (err) {return done(err);}
            assert.equal(records[0].id, 123);
            assert.equal(records[0].name, 'joe');
            assert.equal(records[1].id, 555);
            assert.equal(records[1].name, 'joe');
            return done();
          });
        }).catch(function (err) { return done(err); });
      });
    });

    describe('Finding a single record', function() {

      it('should find a record w/ a numeric ID', function(done) {

        models.user._adapter.datastores.test.manager.collection('user').insertOne({_id: 123, name: 'bob'})
        .then(function() {
          models.user.findOne({id: 123}).exec(function(err, record) {
            if (err) {return done(err);}
            assert.equal(record.id, 123);
            assert.equal(record.name, 'bob');
            return done();
          });
        }).catch(function (err) { return done(err); });

      });

    });

    describe('Finding multiple records', function() {

      it('should find the records correctly', function(done) {

        models.user._adapter.datastores.test.manager.collection('user').insertMany([{_id: 123, name: 'sid'}, {_id: 555, name: 'nancy'}])
        .then(function() {
          models.user.find({id: {'>': 0}}).exec(function(err, records) {
            if (err) {return done(err);}
            assert.equal(records[0].id, 123);
            assert.equal(records[0].name, 'sid');
            assert.equal(records[1].id, 555);
            assert.equal(records[1].name, 'nancy');
            return done();
          });
        }).catch(function (err) { return done(err); });

      });
    });

    describe('Deleting a single record', function() {

      it('should delete the record correctly', function(done) {
        models.user._adapter.datastores.test.manager.collection('user')
        .insertOne({_id: 123, name: 'bob'})
        .then(function() {
          models.user.destroy({id: 123}).exec(function(err) {
            if (err) { return done(err); }
            models.user._adapter.datastores.test.manager.collection('user').find({})
            .toArray().then(function(records) {
              assert.equal(records.length, 0);
              return done();
            }).catch(function (err) { return done(err); });
          });
        }).catch(function (err) { return done(err); });
      });
    });

    describe('Deleting multiple records', function() {

      it('should delete the records correctly', function(done) {

        models.user._adapter.datastores.test.manager.collection('user').insertMany([{_id: 123, name: 'sid'}, {_id: 555, name: 'nancy'}])
        .then(function() {
          models.user.destroy({id: {'>': 0}}).exec(function(err) {
            if (err) {return done(err);}
            models.user._adapter.datastores.test.manager.collection('user').find({}).toArray()
            .then(function(records) {
              assert.equal(records.length, 0);
              return done();
            }).catch(function (err) { return done(err); });
          });
        }).catch(function (err) { return done(err); });

      });
    });

  });

  describe('With associations', function() {

    describe('Where a single model using number keys belongsTo a model using ObjectID', function() {

      before(function(done) {
        setup(
          [createModel('user', {toOne: 'pet'}), createModel('pet', {dontUseObjectIds: true})],
          models,
          done
        );
      });

      after(function(done) {
        models = {};
        if (waterline) {
          return waterline.teardown(done);
        }
        return done();
      });

      it('Should be able to create and retrieve the association successfully', function(done) {

        models.pet.create({id: 123, name: 'alice'}).exec(function(err) {
          if (err) {return done(err);}
          models.user.create({name: 'scott', friend: 123}).exec(function(err, user) {
            if (err) {return done(err);}
            models.user.findOne({id: user.id}).populate('friend').exec(function(err, record) {
              if (err) {return done(err);}
              assert.equal(record.name, 'scott');
              assert(record.friend);
              assert.equal(record.friend.id, 123);
              assert.equal(record.friend.name, 'alice');
              return done();
            });
          });
        });

      });

    });


    describe('Where a single model using ObjectID belongsTo a model using number keys', function() {

      before(function(done) {
        setup(
          [createModel('user', {toOne: 'pet', dontUseObjectIds: true}), createModel('pet')],
          models,
          done
        );
      });

      after(function(done) {
        models = {};
        if (waterline) {
          return waterline.teardown(done);
        }
        return done();
      });

      it('Should be able to create and retrieve the association successfully', function(done) {

        models.pet.create({name: 'alice'}).exec(function(err, pet) {
          if (err) {return done(err);}
          models.user.create({id: 123, name: 'scott', friend: pet.id}).exec(function(err, user) {
            if (err) {return done(err);}
            models.user.findOne({id: user.id}).populate('friend').exec(function(err, record) {
              if (err) {return done(err);}
              assert.equal(record.name, 'scott');
              assert(record.friend);
              assert.equal(record.friend.id, pet.id);
              assert.equal(record.friend.name, 'alice');
              return done();
            });
          });
        });

      });
    });

    describe('Where a collection using number keys belongsTo a model using ObjectID ', function() {

      let userId;

      before(function(done) {
        setup(
          [createModel('user', {oneToMany: 'pet'}), createModel('pet', {toOne: 'user', dontUseObjectIds: true})],
          models,
          function(err) {
            if (err) {return done(err);}
            models.pet.create({id: 123, name: 'alice'}).exec(function(err) {
              if (err) {return done(err);}
              models.user.create({name: 'scott', friends: [123]}).exec(function(err, user) {
                if (err) {return done(err);}
                userId = user.id;
                return done();
              });
            });
          }
        );
      });

      after(function(done) {
        models = {};
        if (waterline) {
          return waterline.teardown(done);
        }
        return done();
      });

      it('Should be able to create and retrieve the association successfully from the "hasMany" side', function(done) {

        models.user.findOne({id: userId}).populate('friends').exec(function(err, record) {
          if (err) {return done(err);}
          assert.equal(record.name, 'scott');
          assert(record.friends);
          assert.equal(record.friends.length, 1);
          assert.equal(record.friends[0].id, 123);
          assert.equal(record.friends[0].name, 'alice');
          return done();
        });

      });

      it('Should be able to create and retrieve the association successfully from the "hasOne" side', function(done) {

        models.pet.findOne({id: 123}).populate('friend').exec(function(err, record) {
          if (err) {return done(err);}
          assert.equal(record.name, 'alice');
          assert(record.friend);
          assert.equal(record.friend.id, userId);
          assert.equal(record.friend.name, 'scott');
          return done();
        });

      });


    });

    describe('Where a collection using ObjectID belongsTo a model using number keys', function() {

      let petId;

      before(function(done) {
        setup(
          [createModel('user', {oneToMany: 'pet', dontUseObjectIds: true}), createModel('pet', {toOne: 'user'})],
          models,
          function(err) {
            if (err) {return done(err);}
            models.pet.create({name: 'alice'}).exec(function(err, pet) {
              if (err) {return done(err);}
              petId = pet.id;
              models.user.create({id: 123, name: 'scott', friends: [pet.id]}).exec(function(err) {
                if (err) {return done(err);}
                return done();
              });
            });
          }
        );
      });

      after(function(done) {
        models = {};
        if (waterline) {
          return waterline.teardown(done);
        }
        return done();
      });

      it('Should be able to create and retrieve the association successfully from the "hasMany" side', function(done) {

        models.user.findOne({id: 123}).populate('friends').exec(function(err, record) {
          if (err) {return done(err);}
          assert.equal(record.name, 'scott');
          assert(record.friends);
          assert.equal(record.friends.length, 1);
          assert.equal(record.friends[0].id, petId);
          assert.equal(record.friends[0].name, 'alice');
          return done();
        });

      });

      it('Should be able to create and retrieve the association successfully from the "hasOne" side', function(done) {

        models.pet.findOne({id: petId}).populate('friend').exec(function(err, record) {
          if (err) {return done(err);}
          assert.equal(record.name, 'alice');
          assert(record.friend);
          assert.equal(record.friend.id, 123);
          assert.equal(record.friend.name, 'scott');
          return done();
        });

      });

    });

    describe('Where a collection using number keys belongsTo a model using ObjectID (vialess)', function() {

      let userId;

      before(function(done) {
        setup(
          [createModel('user', {toManyVialess: 'pet'}), createModel('pet', {dontUseObjectIds: true})],
          models,
          function(err) {
            if (err) {return done(err);}
            models.pet.create({id: 123, name: 'alice'}).exec(function(err) {
              if (err) {return done(err);}
              models.user.create({name: 'scott', friends: [123]}).exec(function(err, user) {
                if (err) {return done(err);}
                userId = user.id;
                return done();
              });
            });
          }
        );
      });

      after(function(done) {
        models = {};
        if (waterline) {
          return waterline.teardown(done);
        }
        return done();
      });

      it('Should be able to create and retrieve the association successfully from the "hasMany" side', function(done) {

        models.user.findOne({id: userId}).populate('friends').exec(function(err, record) {
          if (err) {return done(err);}
          assert.equal(record.name, 'scott');
          assert(record.friends);
          assert.equal(record.friends.length, 1);
          assert.equal(record.friends[0].id, 123);
          assert.equal(record.friends[0].name, 'alice');
          return done();
        });

      });

    });

    describe('Where a collection using ObjectID belongsTo a model using number keys (vialess)', function() {

      let petId;
      // eslint-disable-next-line no-unused-vars
      let userId;

      before(function(done) {
        setup(
          [createModel('user', {toManyVialess: 'pet', dontUseObjectIds: true}), createModel('pet')],
          models,
          function(err) {
            if (err) {return done(err);}
            models.pet.create({name: 'alice'}).exec(function(err, pet) {
              if (err) {return done(err);}
              petId = pet.id;
              models.user.create({id: 123, name: 'scott', friends: [petId]}).exec(function(err, user) {
                if (err) {return done(err);}
                userId = user.id;
                return done();
              });
            });
          }
        );
      });

      after(function(done) {
        models = {};
        if (waterline) {
          return waterline.teardown(done);
        }
        return done();
      });

      it('Should be able to create and retrieve the association successfully from the "hasMany" side', function(done) {

        models.user.findOne({id: 123}).populate('friends').exec(function(err, record) {
          if (err) {return done(err);}
          assert.equal(record.name, 'scott');
          assert(record.friends);
          assert.equal(record.friends.length, 1);
          assert.equal(record.friends[0].id, petId);
          assert.equal(record.friends[0].name, 'alice');
          return done();
        });

      });

    });

    describe('Where a collection using ObjectID has many-to-many relationship with a model using number keys', function() {

      let petId;

      before(function(done) {
        setup(
          [createModel('user', {manyToMany: 'pet', dontUseObjectIds: true}), createModel('pet', {manyToMany: 'user'})],
          models,
          function(err) {
            if (err) {return done(err);}
            models.pet.create({name: 'alice'}).exec(function(err, pet) {
              if (err) {return done(err);}
              petId = pet.id;
              models.user.create({id: 123, name: 'scott', friends: [pet.id]}).exec(function(err) {
                if (err) {return done(err);}
                return done();
              });
            });
          }
        );
      });

      after(function(done) {
        models = {};
        if (waterline) {
          return waterline.teardown(done);
        }
        return done();
      });

      it('Should be able to create and retrieve the association successfully from the side w/out ObjectID', function(done) {

        models.user.findOne({id: 123}).populate('friends').exec(function(err, record) {
          if (err) {return done(err);}
          assert.equal(record.name, 'scott');
          assert(record.friends);
          assert.equal(record.friends.length, 1);
          assert.equal(record.friends[0].id, petId);
          assert.equal(record.friends[0].name, 'alice');
          return done();
        });

      });

      it('Should be able to create and retrieve the association successfully from the side w/ ObjectID', function(done) {
        models.pet.findOne({id: petId}).populate('friends').exec(function(err, record) {
          if (err) {return done(err);}
          assert.equal(record.name, 'alice');
          assert(record.friends);
          assert.equal(record.friends.length, 1);
          assert.equal(record.friends[0].id, 123);
          assert.equal(record.friends[0].name, 'scott');
          return done();
        });

      });

    });

    describe('Where a collection using number keys has many-to-many relationship with a model using number keys', function() {

      before(function(done) {
        setup(
          [createModel('user', {manyToMany: 'pet', dontUseObjectIds: true}), createModel('pet', {manyToMany: 'user', dontUseObjectIds: true})],
          models,
          function(err) {
            if (err) {return done(err);}
            models.pet.create({id: 555, name: 'alice'}).exec(function(err) {
              if (err) {return done(err);}
              models.user.create({id: 123, name: 'scott', friends: [555]}).exec(function(err) {
                if (err) {return done(err);}
                return done();
              });
            });
          }
        );
      });

      after(function(done) {
        models = {};
        if (waterline) {
          return waterline.teardown(done);
        }
        return done();
      });

      it('Should be able to create and retrieve the association successfully from the first side', function(done) {

        models.user.findOne({id: 123}).populate('friends').exec(function(err, record) {
          if (err) {return done(err);}
          assert.equal(record.name, 'scott');
          assert(record.friends);
          assert.equal(record.friends.length, 1);
          assert.equal(record.friends[0].id, 555);
          assert.equal(record.friends[0].name, 'alice');
          return done();
        });

      });

      it('Should be able to create and retrieve the association successfully from the second side', function(done) {
        models.pet.findOne({id: 555}).populate('friends').exec(function(err, record) {
          if (err) {return done(err);}
          assert.equal(record.name, 'alice');
          assert(record.friends);
          assert.equal(record.friends.length, 1);
          assert.equal(record.friends[0].id, 123);
          assert.equal(record.friends[0].name, 'scott');
          return done();
        });

      });

    });

  });

});

function setup(fixtures, modelsContainer, cb) {

  const defaults = {
    primaryKey: 'id',
    datastore: 'test',
    fetchRecordsOnUpdate: true,
    fetchRecordsOnDestroy: true,
    fetchRecordsOnCreate: true,
    fetchRecordsOnCreateEach: true,
    migrate: 'drop'
  };

  waterline = new Waterline();

  _.each(fixtures, function(val, key) {
    const modelFixture = _.extend({}, defaults, fixtures[key]);
    waterline.registerModel(Waterline.Collection.extend(modelFixture));
  });

  const datastores = {
    test: {
      adapter: 'sails-mongo',
      url: process.env.WATERLINE_ADAPTER_TESTS_URL || 'localhost/sails_mongo'
    }
  };

  // Clear the adapter from memory.
  delete require.cache[require.resolve('../')];

  waterline.initialize({ adapters: { 'sails-mongo': require('../') }, datastores: datastores, defaults: defaults }, function(err, orm) {
    if (err) {
      return cb(err);
    }

    // Save a reference to the ORM
    const ORM = orm;

    // Run migrations
    waterlineUtils.autoMigrations('drop', orm, function(err) {
      if (err) {
        return cb(err);
      }

      // Globalize collections for normalization
      _.each(ORM.collections, function(collection, identity) {
        modelsContainer[identity] = collection;
      });
      return cb();
    });
  });

}

function createModel (identity, options) {
  options = options || {};

  const model = {
    datastore: 'test',
    identity: identity,
    attributes: {
      id: { type: 'string', columnName: '_id', autoMigrations: { columnType: 'string', unique: true, autoIncrement: false } },
      name: { type: 'string', autoMigrations: { columnType: 'string', unique: false, autoIncrement: false } }
    }
  };

  if (options.dontUseObjectIds) {
    model.dontUseObjectIds = true;
    model.attributes.id = { type: 'number', columnName: '_id', autoMigrations: { columnType: 'string', unique: true, autoIncrement: false } };
  }

  if (options.toOne) {
    model.attributes.friend = {
      model: options.toOne
    };
  }

  if (options.oneToMany) {
    model.attributes.friends = {
      collection: options.oneToMany,
      via: 'friend'
    };
  }

  if (options.manyToMany) {
    model.attributes.friends = {
      collection: options.manyToMany,
      via: 'friends'
    };
  }

  if (options.toManyVialess) {
    model.attributes.friends = {
      collection: options.toManyVialess
    };
  }
  return model;

}
