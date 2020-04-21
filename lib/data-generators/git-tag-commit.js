var CoreObject  = require('core-object');
var gitRepoInfo = require('git-repo-info');
var RSVP        = require('rsvp');
var simpleGit   = require('simple-git');

module.exports = CoreObject.extend({
  init: function(options) {
    this._super();
    this._plugin = options.plugin;
  },

  generate: function() {
    var separator = this._plugin.readConfig('separator');
    var info = gitRepoInfo();

    if (info === null || info.root === null) {
      return RSVP.reject('Could not find git repository');
    }

    var tag = info.tag;
    var sha = info.sha.slice(0, 8);

    if (!info.tag || !sha) {
      if (sha) {
        return new RSVP.Promise(function(resolve, reject) {
          var git = simpleGit();
          if (process.env.GIT_SSH_COMMAND) {
             git = git.env('GIT_SSH_COMMAND', process.env.GIT_SSH_COMMAND)
          }
          git.silent(true).raw(['describe', '--tags', '--abbrev=0'], function(err, tag) {
            if (err) {
              reject('Could not build revision with tag `' + tag + '` and commit hash `' + sha + '`');
            } else {
              resolve({
                revisionKey: tag.trim() + separator + sha,
                timestamp: new Date().toISOString()
              });
            }
          });
        });
      }
      return RSVP.reject('Could not build revision with tag `' + tag + '` and commit hash `' + sha + '`');
    }

    return RSVP.resolve({
      revisionKey: info.tag + separator + sha,
      timestamp: new Date().toISOString()
    });
  }
});
